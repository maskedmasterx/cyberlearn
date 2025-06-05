import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { useLocation } from 'wouter';
import { ShoppingCart, Trash2, CreditCard } from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [, setLocation] = useLocation();

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.course.price), 0);

  const handleCheckout = () => {
    onClose();
    setLocation('/checkout');
  };

  const handleRemoveItem = async (courseId: number) => {
    await removeFromCart(courseId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border border-green-500 text-green-500 max-w-2xl max-h-[80vh] w-[95vw] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-2xl font-bold text-green-500 flex items-center">
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 mr-2" />
            SHOPPING_CART.exe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center text-green-400 py-8">
              <pre className="text-sm">
{`┌─────────────────────────────────────┐
│  > CART IS EMPTY                    │
│  > ADD SOME COURSES TO CONTINUE     │
└─────────────────────────────────────┘`}
              </pre>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id} className="terminal-border bg-gray-900 p-3 md:p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-green-500 mb-1 text-sm md:text-base leading-tight">{item.course.title}</h4>
                        <div className="text-xs md:text-sm text-green-400 mb-2">
                          {item.course.difficulty} • {item.course.duration}
                        </div>
                        <div className="text-green-500 font-bold text-sm md:text-base">₹{item.course.price}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.courseId)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="terminal-border bg-black p-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>TOTAL_AMOUNT:</span>
                  <span className="text-green-500">${total.toFixed(2)}</span>
                </div>
              </Card>

              <div className="space-y-3">
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-green-500 text-black py-3 font-bold text-sm md:text-lg hover:bg-green-400 transition-all neon-glow"
                >
                  <CreditCard className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  INITIALIZE_CHECKOUT.exe
                </Button>
                
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-all text-sm md:text-base"
                >
                  CONTINUE_SHOPPING.sh
                </Button>

                <Button
                  variant="ghost"
                  onClick={clearCart}
                  className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm md:text-base"
                >
                  CLEAR_CART.exe
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
