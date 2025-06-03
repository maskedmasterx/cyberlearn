import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCart } from '@/hooks/use-cart';
import { Terminal, ArrowLeft, QrCode, Smartphone, MessageCircle } from 'lucide-react';

const CheckoutForm = () => {
  const { toast } = useToast();
  const { cartItems, sessionId, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Generate payment, 2: Show QR, 3: UTR verification

  useEffect(() => {
    if (cartItems.length > 0) {
      generatePayment();
    }
  }, [cartItems]);

  const generatePayment = async () => {
    try {
      const response = await apiRequest("POST", "/api/generate-payment", { sessionId });
      const data = await response.json();
      setPaymentData(data);
      setStep(2);
    } catch (error: any) {
      toast({
        title: "PAYMENT_GENERATION_FAILED.exe",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!utrNumber.trim()) {
      toast({
        title: "UTR_REQUIRED.exe",
        description: "Please enter UTR number",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiRequest("POST", "/api/verify-payment", {
        orderId: paymentData.orderId,
        utrNumber: utrNumber.trim(),
        sessionId
      });

      const data = await response.json();
      
      // Open WhatsApp
      window.open(data.whatsappUrl, '_blank');
      
      await clearCart();
      
      toast({
        title: "VERIFICATION_INITIATED.exe",
        description: "Payment verification sent. You'll receive course access after verification.",
      });

      setLocation('/');
    } catch (error: any) {
      toast({
        title: "VERIFICATION_FAILED.exe",
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
              SECURE_PAYMENT.exe
            </h1>
            
            <pre className="text-green-400 text-sm mb-6">
{`┌─[ PHONEPE_PAYMENT_GATEWAY ]──────────────────────────────┐
│ Initializing secure UPI payment protocol...             │
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
                  <div className="text-green-500 font-bold">₹{item.course.price}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 terminal-border bg-black flex justify-between items-center">
              <span className="text-xl font-bold text-green-500">TOTAL_AMOUNT:</span>
              <span className="text-2xl font-bold text-green-500">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {step === 2 && paymentData && (
            <>
              {/* QR Code Section */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-green-500 mb-4 flex items-center">
                  <QrCode className="w-5 h-5 mr-2" />
                  SCAN_QR_TO_PAY.exe
                </h3>
                
                <div className="terminal-border p-6 bg-black text-center">
                  <img 
                    src={paymentData.qrCodeUrl} 
                    alt="PhonePe QR Code" 
                    className="w-48 h-48 mx-auto mb-4 terminal-border"
                  />
                  
                  <div className="space-y-2 text-green-400">
                    <div className="flex items-center justify-center">
                      <Smartphone className="w-4 h-4 mr-2" />
                      <span>Scan with any UPI app</span>
                    </div>
                    <div className="text-sm">Order ID: {paymentData.orderId}</div>
                    <div className="text-lg font-bold text-green-500">Amount: ₹{paymentData.totalAmount}</div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Button
                    onClick={() => setStep(3)}
                    className="bg-green-500 text-black font-bold hover:bg-green-400 transition-colors"
                  >
                    PAYMENT_COMPLETED.exe
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* UTR Verification */}
              <form onSubmit={handleUtrSubmit} className="space-y-6">
                <div className="terminal-border p-4 bg-black">
                  <h3 className="text-lg font-bold text-green-500 mb-4">UTR_VERIFICATION.form</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-green-400 text-sm mb-2">
                        Enter UTR Number (Transaction ID):
                      </label>
                      <Input
                        type="text"
                        placeholder="12-digit UTR number"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="terminal-input"
                        required
                      />
                      <div className="text-xs text-green-400 mt-1">
                        Check your UPI app for the 12-digit transaction reference number
                      </div>
                    </div>
                    
                    <div className="text-sm text-green-400">
                      <div className="mb-2">Order Details:</div>
                      <div>Order ID: {paymentData?.orderId}</div>
                      <div>Amount: ₹{paymentData?.totalAmount}</div>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-green-500 text-black py-4 font-bold text-lg hover:bg-green-400 transition-all neon-glow"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {isProcessing ? 'VERIFYING_PAYMENT.exe...' : 'SEND_FOR_VERIFICATION.exe'}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <pre className="text-green-400 text-xs">
{`┌─[ PAYMENT_PROCESS ]──────────────────────────────────────┐
│ 1. Scan QR code with any UPI app (PhonePe/GPay/Paytm)  │
│ 2. Complete payment and note the UTR number             │
│ 3. Enter UTR for verification via WhatsApp              │
│ 4. Get course access after manual verification          │
└─────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default function Checkout() {
  const { cartItems } = useCart();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (cartItems.length === 0) {
      setLocation('/');
      return;
    }
  }, [cartItems, setLocation]);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-green-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-green-400">REDIRECTING_TO_ACADEMY.exe</div>
        </div>
      </div>
    );
  }

  return <CheckoutForm />;
}
