// src/components/ContractRenderer.tsx
import { Typography, Divider, Watermark } from "antd";
import type { ContractConfig } from "../types/contract";
import "../styles/a4.css";
import ContractSignSection from "./ContractSignSection";
import contractImage from "../assets/หน้าปกสัญญาจ้าง.png";

const { Title, Paragraph } = Typography;

type Props = {
  config: ContractConfig;
  mode?: "edit" | "view" | "final";
  onSignedAll?: (data: Record<string, string>, stamp?: string | null) => void;
  customerSignatureMap?: Record<string, string>;
};

export default function ContractRenderer({
  config,
  mode = "view",
  onSignedAll,
  customerSignatureMap = {},
}: Props) {
  return (
    <div className="a4-page">
      <Watermark
        height={30}
        width={140}
        image="https://mdn.alipayobjects.com/huamei_7uahnr/afts/img/A*lkAoRbywo0oAAAAAAAAAAAAADrJ8AQ/original"
      >
        <Title level={3} style={{ textAlign: "center" }}>
          {config.title}
        </Title>

        <Paragraph
          style={{
            textAlign: "right",
            marginBottom: "30px",
            marginTop: "30px",
          }}
        >
          สัญญาจัดทำขึ้น ณ วันที่ {config.date}
        </Paragraph>

        <Paragraph
          style={{
            textAlign: "justify",
            lineHeight: 1.8,
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              marginLeft: "30px",
              display: "inline",
              whiteSpace: "nowrap",
            }}
          >
            สัญญาฉบับนี้{" "}
          </span>
          <b
            style={{
              fontSize: "15px",
              margin: "0 5px 0 5px",
              display: "inline",
              whiteSpace: "nowrap",
            }}
          >
            {config.partyA.company}
          </b>
          เป็นผู้จัดทำขึ้นสถานะที่สำนักงานใหญ่ เลขที่ 212/249-250 หมู่บ้าน คุณาลัย
          คอร์ทยาร์ด ถนนบ้านกล้วย-ไทรน้อย ตำบลพิมลราช อำเภอบางบัวทอง จังหวัด
          นนทบุรี 11110 เบอร์ติดต่อหมายเลข 092-586-3663 ซึ่งต่อไปนี้ ในสัญญาเรียกว่า
          “ผู้รับจ้าง” โดยรับจ้างทำบัญชี ให้แก่{" "}
          <b
            style={{
              fontSize: "15px",
              margin: "0 5px 0 5px",
              display: "inline",
              whiteSpace: "nowrap",
            }}
          >
            {config.partyB.company}
          </b>
          ซึ่งต่อไปนี้ในสัญญาเรียกว่า “ผู้ว่าจ้าง”
          <br />
          <span
            style={{
              marginLeft: "30px",
              display: "inline",
              whiteSpace: "nowrap",
            }}
          >
            คู่สัญญาได้ตกลงกันมีข้อความดังต่อไปนี้
          </span>
        </Paragraph>

        {config.clauses.map((clause, index) => (
          <div key={clause.id} style={{ marginBottom: 16 }}>
            {clause.title && (
              <Paragraph
                strong
                style={{
                  marginBottom: "10px",
                  marginLeft: "30px",
                  fontSize: "16px",
                }}
              >
                ข้อ {index + 1}. {clause.title}
              </Paragraph>
            )}

            {clause.blocks.map((block, blockIndex) => (
              <div key={blockIndex}>
                {block.type === "text" && (
                  <Paragraph
                    style={{
                      lineHeight: 1.6,
                      marginBottom: "12px",
                      marginLeft: "30px",
                      fontSize: "14px",
                    }}
                  >
                    {block.content}
                  </Paragraph>
                )}

                {block.type === "list" && (
                  <ol style={{ paddingRight: "5px", marginBottom: "12px" }}>
                    {block.items.map((item, i) => (
                      <li
                        key={i}
                        style={{
                          marginLeft: "30px",
                          fontSize: "14px",
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        ))}
      </Watermark>

      <Divider />

      <ContractSignSection
        signatures={config.signatures}
        stamp={config.stamp}
        mode={mode}
        onSignedAll={onSignedAll}
        customerSignatureMap={customerSignatureMap}
      />
    </div>
  );
}
