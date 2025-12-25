import { Typography, Divider } from "antd";
import type { ContractConfig } from "../types/contract";
import "../styles/a4.css";

// ✅ เพิ่ม
import ContractSignSection from "./ContractSignSection";

const { Title, Paragraph } = Typography;

type Props = {
  config: ContractConfig;
  mode?: "edit" | "view";
  onSignedAll?: (data: Record<string, string>) => void; 
  customerSignatures?: string[]; // เพิ่ม prop สำหรับลายเซ็นของลูกค้า
};

export default function ContractRenderer({ config, mode = "view", onSignedAll, customerSignatures }: Props) {
  return (
    <div className="a4-page">
      {/* ===== Title ===== */}
      <Title level={3} style={{ textAlign: "center" }}>
        {config.title}
      </Title>

      {/* ===== Date ===== */}
      <Paragraph style={{ textAlign: "right" }}>วันที่ {config.date}</Paragraph>

      {/* ===== Parties ===== */}
      <Paragraph>
        สัญญาฉบับนี้{" "}
        <b style={{ fontSize: "18px", margin: "8px" }}>
          {config.partyA.company}
        </b>
        เป็นผู้จัดทำขึ้นสถานะที่สำนักงานใหญ่ เลขที่ 212/249-250 หมู่บ้าน คุณาลัย
        คอร์ทยาร์ด ถนนบ้านกล้วย-ไทรน้อย ตำบลพิมลราช อำเภอบางบัวทอง จังหวัด
        นนทบุรี 11110 เบอร์ติดต่อหมายเลข 092-586-3663 ซึ่งต่อไปนี้
        ในสัญญาเรียกว่า “ผู้รับจ้าง” โดยรับจ้างทำบัญชี ให้แก่{" "}
        <b style={{ fontSize: "18px", margin: "8px" }}>
          {config.partyB.company}
        </b>
        ซึ่งต่อไปนี้ในสัญญาเรียกว่า “ผู้ว่าจ้าง”
      </Paragraph>

      <Paragraph>คู่สัญญาได้ตกลงกันมีข้อความดังต่อไปนี้</Paragraph>

      <Divider />

      {config.clauses.map((clause, index) => (
        <div key={clause.id} style={{ marginBottom: 16 }}>
          {clause.title && (
            <Paragraph strong>
              ข้อ {index + 1}. {clause.title}
            </Paragraph>
          )}

          {clause.blocks.map((block, blockIndex) => (
            <div key={blockIndex}>
              {block.type === "text" && <Paragraph>{block.content}</Paragraph>}

              {block.type === "list" && (
                <ol style={{ paddingLeft: 20 }}>
                  {block.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      ))}

      <Divider />

      {/* แสดงลายเซ็นจากลูกค้า */}
      <div style={{ marginTop: 16 }}>
  <h3>ลายเซ็นลูกค้า:</h3>
  <div style={{ display: "flex", flexWrap: "wrap" }}>
    {customerSignatures && customerSignatures.map((signature, index) => (
      <div key={index} style={{ margin: "10px" }}>
        {/* แสดงภาพจาก Base64 string */}
        <img 
          src={`data:image/png;base64,${signature}`} 
          alt={`Signature ${index}`} 
          style={{ width: "150px", height: "auto", border: "1px solid #ccc" }} 
        />
      </div>
    ))}
  </div>
</div>


      <ContractSignSection
        signatures={config.signatures}
        stamp={config.stamp}
        mode={mode}
        customerSignatures={customerSignatures}
        onSignedAll={onSignedAll}
      />
    </div>
  );
}
