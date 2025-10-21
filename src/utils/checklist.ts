// src/utils/checklist.ts
export type ISODate = string;

export interface ChecklistItem {
  id: string;
  patientId: string;
  text: string;           // ví dụ: "Take morning meds"
  detail?: string;        // brief description shown only when not done
  done: boolean;
  createdBy: string;      // 'system' cho preset
  createdAt: ISODate;
  updatedAt?: ISODate;
  dueAt: ISODate;         // giờ phải làm hôm nay (ISO)
  completedAt?: ISODate;  // set khi tick xong
}