// src/components/ContractSignSection.tsx
import { Upload, Typography, Button, Image } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import SignatureCanvas from "react-signature-canvas";
import { useRef, useState, useEffect } from "react";
import { Row, Col } from "reactstrap";

const { Text } = Typography;

const toImgSrc = (sig?: string) => {
  if (!sig) return "";
  return sig.startsWith("data:image") ? sig : `data:image/png;base64,${sig}`;
};

const isCustomerRole = (role: string) => role.startsWith("customer_");
const isCompanyRole = (role: string) => role.startsWith("company_");

type SignItemProps = {
  role: string;
  name?: string;
  position?: string;
  inlineName?: boolean;
  locked?: boolean;
  image?: string;
  mode?: "edit" | "view" | "final";
  onSigned?: (dataUrl: string, role: string) => void;
};

function SignItem({
  role,
  name,
  position,
  inlineName,
  locked,
  image,
  mode = "edit",
  onSigned,
}: SignItemProps) {
  const sigRef = useRef<SignatureCanvas>(null);

  const clearSignature = () => sigRef.current?.clear();

  const handleEnd = () => {
    if (sigRef.current && onSigned) {
      const dataUrl = sigRef.current.toDataURL();
      onSigned(dataUrl, role);
    }
  };

  // FINAL: โชว์รูปอย่างเดียว
  if (mode === "final") {
    return (
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            width: "100%",
            height: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {image ? (
            <img
              src={toImgSrc(image)}
              alt={name ?? role}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <div style={{ width: "100%", height: 90 }} />
          )}
        </div>

        <div style={{ marginTop: 6 }}>
          <Text style={{ fontSize: 14 }}>
            (ลงชื่อ){" "}
            {inlineName && name ? (
              <>
                {".......... "} {name} {" .......... "}
              </>
            ) : (
              <>{"........................................................ "}</>
            )}
            {role}
          </Text>
        </div>

        {position && <div>{position}</div>}
      </div>
    );
  }

  // VIEW: อ่านอย่างเดียว (ถ้ามีรูปแสดง, ไม่มีรูปก็เว้นว่าง)
  if (mode === "view") {
    return (
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            width: "100%",
            height: 140,
            border: "2px solid #d9d9d9",
            background: "#fff",
            borderRadius: 10,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {image ? (
            <img
              src={toImgSrc(image)}
              alt={name ?? role}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : null}
        </div>

        <div style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 14 }}>
            (ลงชื่อ){" "}
            {inlineName && name ? (
              <>
                {".......... "} {name} {" .......... "}
              </>
            ) : (
              <>{"........................................................ "}</>
            )}
            {role}
          </Text>
        </div>

        {position && <div>{position}</div>}
      </div>
    );
  }

  // EDIT: เซ็นได้ถ้าไม่ถูกล็อก
  return (
    <div style={{ marginBottom: 40 }}>
      <div
        style={{
          width: "100%",
          height: 140,
          border: "2px solid #d9d9d9",
          background: "#fff",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        {locked ? (
          // โหมด edit แต่ locked: แสดงรูปถ้ามี (กันผู้ใช้เซ็น)
          image ? (
            <img
              src={toImgSrc(image)}
              alt={name ?? role}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#fff" }} />
          )
        ) : (
          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            onEnd={handleEnd}
            canvasProps={{ style: { width: "100%", height: "100%", display: "block" } }}
          />
        )}
      </div>

      <div
        style={{
          marginTop: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Text style={{ fontSize: 14 }}>
          (ลงชื่อ){" "}
          {inlineName && name ? (
            <>
              {".......... "} {name} {" .......... "}
            </>
          ) : (
            <>{"........................................................ "}</>
          )}
          {role}
        </Text>

        {!locked && (
          <Button size="small" danger onClick={clearSignature}>
            ลบลายเซ็น
          </Button>
        )}
      </div>

      {position && <div>{position}</div>}
    </div>
  );
}

type ContractSignSectionProps = {
  signatures?: {
    id: string;
    role: string;
    name?: string;
    position?: string;
    image?: string;
    inlineName?: boolean;
  }[];
  stamp?: string | null;
  mode?: "edit" | "view" | "final";
  onSignedAll?: (signatures: Record<string, string>, stamp?: string | null) => void;
  customerSignatureMap?: Record<string, string>;
  /** ใครกำลังดู: customer = เห็นเฉพาะช่องลูกค้า, company = เห็นหมด */
  viewFor?: "customer" | "company" | "all";
};

export default function ContractSignSection({
  signatures = [],
  stamp: defaultStamp = null,
  mode = "edit",
  onSignedAll,
  customerSignatureMap = {},
  viewFor = "all",
}: ContractSignSectionProps) {
  const [stamp, setStamp] = useState<string | null>(defaultStamp);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [signData, setSignData] = useState<Record<string, string>>({});

  useEffect(() => {
    setStamp(defaultStamp ?? null);
  }, [defaultStamp]);

  const handleSigned = (dataUrl: string, role: string) => {
    const newData = { ...signData, [role]: dataUrl };
    setSignData(newData);
    onSignedAll?.(newData, stamp);
  };

  const isFinal = mode === "final";

  // กรองลายเซ็นตามผู้ชม
  const filteredSignatures = signatures.filter((s) => {
    if (viewFor === "customer") return isCustomerRole(s.role);
    if (viewFor === "company") return true; // บริษัทเห็นทั้งหมด
    return true; // all
  });

  // ตัดสินใจว่า "ช่องนี้แก้ไขได้ไหม" ตามผู้ชม + โหมด
  const resolveItemMode = (role: string, baseMode: "edit" | "view" | "final"): "edit" | "view" | "final" => {
    if (baseMode === "final") return "final"; // ฉบับสุดท้ายอ่านอย่างเดียวทุกคน

    // ถ้าเป็นหน้า edit:
    if (viewFor === "customer") {
      // ลูกค้าแก้ได้เฉพาะ customer_*
      return isCustomerRole(role) ? "edit" : "view";
    }
    if (viewFor === "company") {
      // บริษัทแก้ได้เฉพาะ company_*
      return isCompanyRole(role) ? "edit" : "view";
    }
    // all = ตามปกติ (อนุโลมให้แก้เฉพาะ company_* เป็นดีฟอลต์)
    return isCompanyRole(role) ? "edit" : "view";
  };

  const isStampVisible = viewFor !== "customer"; // ลูกค้าไม่เห็น/ไม่อัปโหลดตราประทับ

  return (
    <div className="signature-section" style={{ marginTop: 40 }}>
      {isStampVisible && (
        <Row
          className="mb-5"
          style={{ marginBottom: 50, display: "flex", alignItems: "center" }}
        >
          <Col md={6}>
            <Row style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Text strong style={{ fontSize: 16, whiteSpace: "nowrap" }}>
                ตราประทับบริษัท
              </Text>

              {mode === "edit" ? (
                <Upload
                  name="stamp"
                  listType="picture-circle"
                  showUploadList={false}
                  accept="image/*"
                  beforeUpload={(file) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const img = reader.result as string;
                      setStamp(img);
                      onSignedAll?.(signData, img);
                    };
                    reader.readAsDataURL(file);
                    return false;
                  }}
                  onPreview={() => setPreviewOpen(true)}
                >
                  {stamp ? (
                    <img
                      src={stamp}
                      alt="ตราประทับ"
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid #e6f4ff",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: "50%",
                        border: "2px dashed #91caff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#1677ff",
                        background: "#f5faff",
                        cursor: "pointer",
                      }}
                    >
                      <PlusOutlined style={{ fontSize: 22, marginBottom: 4 }} />
                      <span style={{ fontSize: 13 }}>อัปโหลด</span>
                    </div>
                  )}
                </Upload>
              ) : stamp ? (
                <img
                  src={stamp}
                  alt="ตราประทับ"
                  style={{
                    width: isFinal ? 100 : 120,
                    height: isFinal ? 100 : 120,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid #e6f4ff",
                  }}
                />
              ) : null}

              {stamp && (
                <Image
                  styles={{ root: { display: "none" } }}
                  preview={{
                    open: previewOpen,
                    onOpenChange: (visible) => setPreviewOpen(visible),
                  }}
                  src={stamp}
                />
              )}
            </Row>
          </Col>
        </Row>
      )}

      <Row className="gy-4 gx-4">
        {filteredSignatures.map((sig) => {
          const mappedImg = customerSignatureMap[sig.role];
          const img = mappedImg || sig.image;
          const isMapped = !!mappedImg;

          // โหมดต่อช่อง: ตาม viewFor + mode ปัจจุบัน
          let itemMode = resolveItemMode(sig.role, mode);

          // ถ้ามีรูปจากฝั่งตรงข้าม map มาแล้ว ให้เป็น view (กันแก้)
          if (itemMode !== "final" && isMapped) itemMode = "view";

          const locked =
            itemMode !== "edit" || isMapped || isFinal;

          return (
            <Col md={6} key={sig.id}>
              <SignItem
                role={sig.role}
                name={sig.name}
                position={sig.position}
                inlineName={sig.inlineName}
                image={img}
                mode={itemMode}
                locked={locked}
                onSigned={locked ? undefined : (data, role) => {
                  handleSigned(data, role);
                }}
              />
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
