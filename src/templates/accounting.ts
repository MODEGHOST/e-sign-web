import type { ContractConfig } from "../types/contract";

export const accountingTemplate: ContractConfig = {
  title: "สัญญาจ้างบริการทำบัญชี",
  date: "1 สิงหาคม 2568",


  partyA: {
    company: "บริษัท บิลด์มีอัพ คอนซัลแทนท์ จำกัด",
    taxId: "",     
    buildNo: "",   
  },


  partyB: {
    company: "กรอกชื่อบริษัทลูกค้า",
    taxId: "",    
    buildNo: "",  
  },

  clauses: [
    {
      id: "c1",
      blocks: [
        { type: "text", content: "รายละเอียดงานที่ต้องทำ" },
        {
          type: "list",
          items: ["บันทึกบัญชีประจำเดือน", "ยื่นภาษีประจำเดือน", "ปิดงบการเงิน"],
        },
      ],
    },
    {
      id: "c2",
      blocks: [{ type: "text", content: "ค่าบริการเดือนละ 4,500 บาท" }],
    },
  ],


  signatures: [
    {
      id: "sig-company-director",
      role: "company_director",
      name: "พี่แนน",
      position: "",
      inlineName: true,
    },
    {
      id: "sig-company-witness",
      role: "company_witness",
      name: "พี่เอ",
      position: "",
      inlineName: true,
    },
    {
      id: "sig-customer-director",
      role: "customer_director",
      name: "",
      position: "",
      inlineName: true,
    },
    {
      id: "sig-customer-witness",
      role: "customer_witness",
      name: "",
      position: "",
      inlineName: true,
    },
  ],
};
