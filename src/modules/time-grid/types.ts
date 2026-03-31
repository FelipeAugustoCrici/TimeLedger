export type BlockType = 'work' | 'break' | 'meeting' | 'study' | 'personal';

export const BLOCK_TYPE_CONFIG: Record<BlockType, { label: string; color: string; bg: string; border: string }> = {
  work:     { label: 'Trabalho',  color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/40' },
  break:    { label: 'Pausa',     color: 'text-slate-400',  bg: 'bg-slate-500/20',  border: 'border-slate-500/40' },
  meeting:  { label: 'Reunião',   color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40' },
  study:    { label: 'Estudo',    color: 'text-amber-400',  bg: 'bg-amber-500/20',  border: 'border-amber-500/40' },
  personal: { label: 'Pessoal',   color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/40' },
};

export interface TimeBlock {
  id: string;
  date: string;
  startSlot: number;
  endSlot: number;
  startTime: string;   // "HH:MM" — horário real persistido
  endTime: string;     // "HH:MM"
  taskCode: string;
  description: string;
  type: BlockType;
  category?: string;
  project?: string;
  notes?: string;
  hourlyRate: number;
  totalMinutes: number;
  totalAmount: number;
  status: 'pending' | 'in_progress' | 'done';
  col?: number;
  totalCols?: number;
}

export interface TimeBlockFormData {
  taskCode: string;
  description: string;
  type: BlockType;
  category: string;
  project: string;
  notes: string;
  hourlyRate: number;
  status: 'pending' | 'in_progress' | 'done';
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface SelectionState {
  date: string;
  startSlot: number;
  endSlot: number;
}
