'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/use-convex-query';
import { Mail, AlertTriangle } from 'lucide-react';

export function PaymentReminder({ userId, userName, userEmail, amount, isGroup = false }) {
  const [open, setOpen] = useState(false);
  const [reminderType, setReminderType] = useState('normal');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { mutate: sendEmail } = useConvexMutation(api.email.sendEmail);

  const normalTemplate = `
    <h2>Payment Reminder</h2>
    <p>Hi ${userName},</p>
    <p>This is a friendly reminder that you owe ₹${amount.toFixed(2)}.</p>
    <p>Please settle this payment at your earliest convenience.</p>
    <p>Thank you!</p>
  `;

  const slurTemplate = `
    <h2>URGENT: Payment Reminder</h2>
    <p>Hey ${userName},</p>
    <p>This is a reminder that you still owe ₹${amount.toFixed(2)}.</p>
    <p>It's been a while, and I really need this money back ASAP!</p>
    <p>Please settle this payment immediately.</p>
  `;

  const handleSendReminder = async () => {
    setIsSending(true);
    try {
      const template = reminderType === 'normal' ? normalTemplate : slurTemplate;
      const finalHtml = customMessage ? `
        <h2>${reminderType === 'normal' ? 'Payment Reminder' : 'URGENT: Payment Reminder'}</h2>
        <p>Hi ${userName},</p>
        <p>${customMessage}</p>
        <p>Amount: ₹${amount.toFixed(2)}</p>
      ` : template;

      await sendEmail({
        to: userEmail,
        subject: reminderType === 'normal' ? 'Payment Reminder' : 'URGENT: Payment Reminder',
        html: finalHtml,
      });

      toast.success('Reminder sent!', {
        description: `Payment reminder has been sent to ${userName}.`,
      });
      setOpen(false);
    } catch (error) {
      toast.error('Failed to send reminder', {
        description: error.message || 'An error occurred while sending the reminder.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setOpen(true)}
        className="flex items-center gap-1"
      >
        <Mail className="h-4 w-4" />
        Send Reminder
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Tabs defaultValue="normal" onValueChange={setReminderType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="normal">Normal</TabsTrigger>
                <TabsTrigger value="slur" className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Urgent
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="normal" className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Send a friendly reminder to {userName} about the pending payment of ₹{amount.toFixed(2)}.
                </p>
                <Textarea 
                  placeholder="Add a custom message (optional)" 
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </TabsContent>
              
              <TabsContent value="slur" className="mt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
                  <p className="text-sm text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    This will send a more strongly worded reminder. Use with caution!
                  </p>
                </div>
                <Textarea 
                  placeholder="Add your urgent message here (optional)" 
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSendReminder} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}