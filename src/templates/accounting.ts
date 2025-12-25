import type { ContractConfig } from "../types/contract";

export const accountingTemplate: ContractConfig = {
  title: "สัญญาจ้างบริการทำบัญชี",
  date: "1 สิงหาคม 2568",

  partyA: { company: "บริษัท บิลด์มีอัพ คอนซัลแทนท์ จำกัด" },
  partyB: { company: "บริษัท ไอแวร์แอนด์ริช จำกัด" },

  clauses: [
    {
      id: "c1",
      blocks: [
        { type: "text", content: "รายละเอียดงานที่ต้องทำ" },
        {
          type: "list",
          items: [
            "บันทึกบัญชีประจำเดือน",
            "ยื่นภาษีประจำเดือน",
            "ปิดงบการเงิน",
          ],
        },
      ],
    },
    {
      id: "c2",
      blocks: [
        { type: "text", content: "ค่าบริการเดือนละ 4,500 บาท" },
      ],
    },
  ],

  
  signatures: [
    {
      id: "s1",
      role: "ผู้ว่าจ้าง",
      name: "นายสมชาย ใจดี",
      position: "กรรมการผู้จัดการ",
    },
    {
      id: "s2",
      role: "ผู้รับจ้าง",
      name: "นางสาวปิยะธิดา นักบัญชี",
      position: "นักบัญชี",
    },
  ],
};

