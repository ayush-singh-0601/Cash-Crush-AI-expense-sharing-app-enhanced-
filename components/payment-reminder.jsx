'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { useAction } from 'convex/react';
import { Mail, AlertTriangle, Laugh, AlertCircle, Heart, Zap } from 'lucide-react';
import { createCashCrushReminderTemplate, reminderTypes } from '@/lib/email-templates/cash-crush-reminder';

export function PaymentReminder({ userId, userName, userEmail, amount, isGroup = false, groupName = '', description = '', senderName = 'Your friend' }) {
  const [open, setOpen] = useState(false);
  const [reminderType, setReminderType] = useState('normal');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Get the email action function directly
  const sendEmail = useAction(api.email.sendEmail);

  const handleSendReminder = async (e) => {
    if (e) e.preventDefault();
    
    // Check if sendEmail is a function
    if (typeof sendEmail !== 'function') {
      console.error('sendEmail is not a function:', sendEmail);
      toast.error('Email service not available');
      return;
    }

    setIsSending(true);
    
    try {
      // Generate the beautiful Cash Crush email template
      const emailTemplate = createCashCrushReminderTemplate({
        recipientName: userName,
        senderName: senderName,
        amount: amount,
        description: reminderType === 'custom' ? customMessage : description,
        isGroup: isGroup,
        groupName: groupName,
        reminderType: reminderType,
        logoBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACAAAAAgACAIAAAA9xURnAAAAA3NCSVQICAjb4U/gAAAJk3pUWHRSYXcgcHJvZmlsZSB0eXBlIEFQUDEAAFiFtZhbshzHDUT/uQotoV5AoZZTD5RCEQ7bof1/+KBneHlJUQ76w9NST0/feiYSiSx++d3/6X/+sX/795//un/8w7/8xqe0bl/aaKPMlJKl16emlEvK8c399Xl/18xT4aG/f5fXtw7rqX1qN1/f+z2m0EKr5s7/rw5xG69x2tdpa+FijJl+NneKRX6a42PF9W/ey/fv53tNJc0Weyjv92bpu482LbXWUY0VSS0qPBfNtbMD0VbTf7/ek7zmLd/2JyXGfL/7ft/5o99XbO" // Your logo base64
      });

      // Generate subject based on reminder type
      const subjects = {
        normal: `Payment reminder from ${senderName} - Cash Crush`,
        urgent: `🚨 Urgent payment reminder - Cash Crush`,
        funny: `💰 Your money is calling! - Cash Crush`,
        polite: `Gentle payment reminder - Cash Crush`,
        custom: `Payment reminder - Cash Crush`
      };

      await sendEmail({
        to: userEmail,
        subject: subjects[reminderType] || subjects.normal,
        html: emailTemplate
      });

      toast.success('Beautiful Cash Crush reminder sent successfully! 💰');
      setOpen(false);
    } catch (error) {
      console.error('Error sending reminder:', error);
      const errorDescription = error.message || 'An error occurred while sending the reminder.';
      toast.error('Failed to send reminder', {
        description: errorDescription,
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
        type="button"
      >
        <Mail className="h-4 w-4" />
        Send Reminder
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                💰
              </div>
              <div>
                <div>Send Cash Crush Reminder</div>
                <div className="text-sm font-normal text-muted-foreground">
                  Beautiful, professional email reminders
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={reminderType} onValueChange={setReminderType} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="normal" className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Friendly
              </TabsTrigger>
              <TabsTrigger value="polite" className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                Polite
              </TabsTrigger>
              <TabsTrigger value="urgent" className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Urgent
              </TabsTrigger>
              <TabsTrigger value="funny" className="flex items-center gap-1">
                <Laugh className="h-4 w-4" />
                Funny
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
            
            <TabsContent value="urgent" className="mt-4">
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
            
            <TabsContent value="polite" className="mt-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                <p className="text-sm text-green-800 flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  This will send a very polite and gentle reminder. Perfect for maintaining good relationships!
                </p>
              </div>
              <Textarea 
                placeholder="Add your polite message here (optional)" 
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </TabsContent>
            
            <TabsContent value="urgent" className="mt-4">
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
            
            <TabsContent value="funny" className="mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                <p className="text-sm text-blue-800 flex items-center gap-1">
                  <Laugh className="h-4 w-4" />
                  This will send a humorous reminder. Perfect for friends who need a laugh while being reminded!
                </p>
              </div>
              <Textarea 
                placeholder="Add your funny message here (optional)" 
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button 
              onClick={handleSendReminder} 
              disabled={isSending}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Beautiful Email...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Cash Crush Reminder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}