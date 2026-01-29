// src/components/ContractRenderer.tsx
import { Typography, Watermark } from "antd";
import type { ContractConfig } from "../types/contract";
import "../styles/a4.css";
import ContractSignSection from "./ContractSignSection";
import bmuOpacity from "../assets/BMU_opacity.png";
import coverImage from "../assets/Cover_Final.png";

const { Title, Paragraph } = Typography;

const HeaderBar = () => <div className="content-header-band" />;

type Props = {
  config: ContractConfig;
  mode?: "edit" | "view" | "final";
  onSignedAll?: (data: Record<string, string>, stamp?: string | null) => void;
  customerSignatureMap?: Record<string, string>;
  viewFor?: "customer" | "company" | "all";
  customerStamp?: string | null;
  onCustomerStampChange?: (dataUrl: string | null) => void;
};

export default function ContractRenderer({
  config,
  mode = "view",
  onSignedAll,
  customerSignatureMap = {},
  viewFor = "all",
  customerStamp = null,
  onCustomerStampChange,
}: Props) {
  return (
    <>
      {/* หน้า Cover (หน้าปก) */}
      <div className="a4-page a4-cover" style={{ position: "relative" }}>
        {/* รูปภาพหน้าปก */}
        <img
          src={coverImage}
          alt="หน้าปกสัญญา"
          style={{
            display: "block",
            width: "210mm",
            height: "297mm",
            objectFit: "cover",
          }}
        />

        {/* ข้อความชื่อบริษัทลูกค้า */}
        <div
          style={{
            position: "absolute",
            top: "46%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            color: "#ff5e00",
            fontFamily: "'Prompt', sans-serif",
            fontWeight: "bold",
          }}
        >
          <div style={{ fontSize: 30, lineHeight: 1.2 }}>
            {config.partyB.company || "ชื่อบริษัทลูกค้า"}
          </div>

          <div
            style={{
              fontSize: 30,
              marginTop: 8,
              textAlign: "center",
              color: "#ff5e00",
              fontFamily: "'Prompt', sans-serif",
              fontWeight: "bold",
            }}
          >
            {config.partyB.taxId || "เลขนิติบุคคลลูกค้า"}
          </div>
        </div>
      </div>

      {/* หน้าเนื้อหาสัญญา */}
      <div className="a4-page">
        <HeaderBar />
        <div className="a4-inner">
          <div className="page-safe-top">
            <Watermark height={30} width={140} image={bmuOpacity}>
              <div className="contract-body">
                <div className="avoid-break">
                  <Title
                    level={3}
                    style={{ textAlign: "center", margin: "0 0 8px" }}
                  >
                    {config.title}
                  </Title>
                  <Paragraph style={{ textAlign: "right", margin: "0 0 14px" }}>
                    สัญญาจัดทำขึ้น ณ วันที่ {config.date}
                  </Paragraph>
                </div>

                <Paragraph
                  style={{
                    textAlign: "justify",
                    lineHeight: 1.8,
                    marginBottom: 20,
                  }}
                >
                  <span
                    style={{
                      marginLeft: 30,
                      display: "inline",
                      whiteSpace: "nowrap",
                    }}
                  >
                    สัญญาฉบับนี้{" "}
                  </span>
                  <b
                    style={{
                      fontSize: 15,
                      margin: "0 5px",
                      display: "inline",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {config.partyA.company}
                  </b>
                  เป็นผู้จัดทำขึ้นสถานะที่สำนักงานใหญ่ เลขที่ 212/249-250
                  หมู่บ้าน คุณาลัย คอร์ทยาร์ด ถนนบ้านกล้วย-ไทรน้อย ตำบลพิมลราช
                  อำเภอบางบัวทอง จังหวัด นนทบุรี 11110 เบอร์ติดต่อหมายเลข
                  092-586-3663 ซึ่งต่อไปนี้ในสัญญาเรียกว่า “ผู้รับจ้าง”
                  โดยรับจ้างทำบัญชี ให้แก่{" "}
                  <b
                    style={{
                      fontSize: 15,
                      margin: "0 5px",
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
                      marginLeft: 30,
                      display: "inline",
                      whiteSpace: "nowrap",
                    }}
                  >
                    คู่สัญญาได้ตกลงกันมีข้อความดังต่อไปนี้
                  </span>
                </Paragraph>

                {config.clauses.map((clause, index) => (
                  <section
                    key={clause.id}
                    className="clause-block avoid-break"
                    style={{ marginBottom: 16 }}
                  >
                    {clause.title && (
                      <Paragraph
                        strong
                        className="keep-with-next"
                        style={{
                          marginBottom: 10,
                          marginLeft: 30,
                          fontSize: 16,
                        }}
                      >
                        ข้อ {index + 1}. {clause.title}
                      </Paragraph>
                    )}

                    {clause.blocks.map((block, blockIndex) => (
                      <div key={blockIndex} className="avoid-break">
                        {block.type === "text" && (
                          <Paragraph
                            className="keep-lines"
                            style={{
                              lineHeight: 1.6,
                              marginBottom: 12,
                              marginLeft: 30,
                              fontSize: 14,
                            }}
                          >
                            {block.content}
                          </Paragraph>
                        )}

                        {block.type === "list" && (
                          <ol
                            className="keep-lines"
                            style={{ paddingRight: 5, marginBottom: 12 }}
                          >
                            {block.items.map((item, i) => (
                              <li
                                key={i}
                                className="keep-lines"
                                style={{ marginLeft: 30, fontSize: 14 }}
                              >
                                {item}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}
                  </section>
                ))}
              </div>
            </Watermark>
          </div>
        </div>
      </div>

      {/* หน้าเซ็นชื่อ */}
      <div className="a4-page">
        <HeaderBar />
        <div className="a4-inner">
          <ContractSignSection
            signatures={config.signatures}
            mode={mode}
            viewFor={viewFor}
            onSignedAll={onSignedAll}
            customerSignatureMap={customerSignatureMap}
            customerStamp={customerStamp}
            onCustomerStampChange={onCustomerStampChange}
          />
        </div>
      </div>
    </>
  );
}
