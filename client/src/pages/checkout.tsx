import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCart } from '@/hooks/use-cart';
import { Terminal, ArrowLeft, CreditCard } from 'lucide-react';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { cartItems, sessionId, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "PAYMENT_FAILED.exe",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Payment succeeded, complete the order
        const paymentIntent = await stripe.retrievePaymentIntent(
          new URLSearchParams(window.location.search).get('payment_intent_client_secret') || ''
        );

        if (paymentIntent.paymentIntent) {
          await apiRequest("POST", "/api/complete-order", {
            sessionId,
            paymentIntentId: paymentIntent.paymentIntent.id
          });

          await clearCart();
          
          toast({
            title: "PAYMENT_SUCCESSFUL.exe",
            description: "Access credentials will be sent to your secure channel.",
          });

          setLocation('/');
        }
      }
    } catch (error: any) {
      toast({
        title: "TRANSACTION_ERROR.exe",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.course.price), 0);

  return (
    <div className="min-h-screen bg-black text-green-500 py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="terminal-border bg-gray-900 p-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="text-green-400 hover:text-green-500 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              RETURN_TO_ACADEMY.sh
            </Button>
            
            <h1 className="text-3xl font-bold text-green-500 mb-4 flex items-center">
              <Terminal className="w-8 h-8 mr-3" />
              SECURE_CHECKOUT.exe
            </h1>
            
            <pre className="text-green-400 text-sm mb-6">
{`┌─[ PAYMENT_PROCESSOR ]────────────────────────────────────┐
│ Initializing secure payment protocol...                 │
│ Encryption: AES-256 | Status: ACTIVE                   │
└─────────────────────────────────────────────────────────┘`}
            </pre>
          </div>

          {/* Order Summary */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-green-500 mb-4">ORDER_SUMMARY.txt</h3>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 terminal-border bg-black">
                  <div>
                    <div className="font-bold text-green-500">{item.course.title}</div>
                    <div className="text-sm text-green-400">{item.course.difficulty} • {item.course.duration}</div>
                  </div>
                  <div className="text-green-500 font-bold">${item.course.price}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 terminal-border bg-black flex justify-between items-center">
              <span className="text-xl font-bold text-green-500">TOTAL_AMOUNT:</span>
              <span className="text-2xl font-bold text-green-500">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="terminal-border p-4 bg-black">
              <h3 className="text-lg font-bold text-green-500 mb-4">PAYMENT_DETAILS.form</h3>
              <PaymentElement 
                options={{
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#00FF00',
                      colorBackground: '#000000',
                      colorText: '#00FF00',
                      colorDanger: '#FF0040',
                      fontFamily: 'monospace',
                      borderRadius: '4px',
                    }
                  }
                }}
              />
            </div>
            
            <Button
              type="submit"
              disabled={!stripe || !elements || isProcessing}
              className="w-full bg-green-500 text-black py-4 font-bold text-lg hover:bg-green-400 transition-all neon-glow"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {isProcessing ? 'PROCESSING_PAYMENT.exe...' : 'COMPLETE_PURCHASE.exe'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <pre className="text-green-400 text-xs">
{`┌─[ SECURITY_NOTICE ]──────────────────────────────────────┐
│ All transactions are encrypted and processed securely   │
│ Your payment information is never stored on our servers │
└─────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const { cartItems, sessionId } = useCart();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (cartItems.length === 0) {
      setLocation('/');
      return;
    }

    const total = cartItems.reduce((sum, item) => sum + parseFloat(item.course.price), 0);

    apiRequest("POST", "/api/create-payment-intent", { 
      amount: total.toFixed(2),
      sessionId 
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error('Error creating payment intent:', error);
        setLocation('/');
      });
  }, [cartItems, sessionId, setLocation]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-black text-green-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-green-400">INITIALIZING_PAYMENT_SYSTEM.exe</div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}
