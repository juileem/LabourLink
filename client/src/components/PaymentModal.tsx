import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "./Button";
import { Card } from "./Card";

export interface PaymentPayload {
  jobId: number;
  workerId: number;
  contractorId: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSubmit: (payload: PaymentPayload) => Promise<void>;
  workerName: string;
  workerId: number;
  jobId: number;
  jobTitle: string;
  amount: number;
  contractorId: number;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  onSubmit,
  workerName,
  workerId,
  jobId,
  jobTitle,
  amount,
  contractorId
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"pending" | "success">("pending");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handlePay = async () => {
    setLoading(true);
    setError("");

    // Simulate Network/Processing latency
    setTimeout(async () => {
      try {
        await onSubmit({
          jobId,
          workerId,
          contractorId,
          amount,
          paymentMethod: "UPI",
          paymentStatus: "success"
        });
        setStatus("success");
        // Show success briefly before closing
        setTimeout(() => {
          onClose();
          onSuccess(); // Triggers the Rating screen seamlessly
          // Reset UI
          setStatus("pending");
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Payment processing failed");
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  // UPI deep link schema for realism
  const upiUrl = `upi://pay?pa=worker@upi&pn=${encodeURIComponent(workerName)}&am=${amount}&mc=0000`;

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-[400px] relative text-center">
        {status === "success" ? (
          <div className="space-y-4 py-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-emerald-400">Payment Successful ✔</h2>
            <p className="text-stone-300">Transaction ID: TXN-{Math.floor(Math.random() * 1000000)}</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Job Completed 🎉</h2>
            <p className="text-sm rounded border border-brand-500/30 bg-brand-500/10 inline-block px-2 text-brand-300 mb-4 font-semibold uppercase tracking-wide">
              Demo UPI Payment
            </p>

            {error ? (
              <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 text-left">
                {error}
              </div>
            ) : null}

            <div className="text-left bg-stone-950/50 p-4 rounded-xl ring-1 ring-white/10 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Worker</span>
                <span className="font-semibold text-stone-200">{workerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Job Task</span>
                <span className="font-semibold text-stone-200">{jobTitle} Work</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                <span className="text-stone-400 uppercase text-xs tracking-wider">Amount</span>
                <span className="font-bold text-green-400 font-mono text-lg">₹{amount}</span>
              </div>
            </div>

            <div className="flex justify-center mb-6 py-4 bg-white/5 rounded-xl">
              <div className="p-3 bg-white rounded-lg inline-block">
                <QRCodeSVG value={upiUrl} size={150} />
              </div>
            </div>

            <div className="relative flex items-center py-2 mb-4">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-stone-500 text-sm">or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handlePay} disabled={loading} className="w-full h-12 text-lg">
                {loading ? "Processing..." : "Pay via UPI"}
              </Button>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="w-full text-stone-400"
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
