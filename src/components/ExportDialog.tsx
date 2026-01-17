import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportDialogProps {
    trigger?: React.ReactNode;
    onExport: (format: 'csv' | 'pdf', range: string) => Promise<void>;
}

export function ExportDialog({ trigger, onExport }: ExportDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
    const [range, setRange] = useState('current_month');

    const handleExport = async () => {
        setLoading(true);
        try {
            await onExport(format, range);
            setOpen(false);
            toast.success('Export started successfully');
        } catch (error) {
            toast.error('Export failed', { description: 'Please try again later.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export Data
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Attendance Report</DialogTitle>
                    <DialogDescription>
                        Choose the format and date range for your report.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-3">
                        <Label>Export Format</Label>
                        <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'csv' | 'pdf')} className="grid grid-cols-2 gap-4">
                            <div>
                                <RadioGroupItem value="csv" id="csv" className="peer sr-only" />
                                <Label
                                    htmlFor="csv"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                >
                                    <FileSpreadsheet className="mb-2 h-6 w-6 text-green-600" />
                                    CSV
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="pdf" id="pdf" className="peer sr-only" disabled />
                                <Label
                                    htmlFor="pdf"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer opacity-50"
                                >
                                    <FileText className="mb-2 h-6 w-6 text-red-600" />
                                    PDF (Coming Soon)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-3">
                        <Label>Date Range</Label>
                        <Select value={range} onValueChange={setRange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="current_month">Current Month</SelectItem>
                                <SelectItem value="last_month">Last Month</SelectItem>
                                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                                <SelectItem value="year_to_date">Year to Date</SelectItem>
                                <SelectItem value="all_time">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={handleExport} disabled={loading} className="gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Download Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
