import { Upload, Typography, Button, Image } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import SignatureCanvas from "react-signature-canvas";
import { useRef, useState } from "react";
import { Row, Col } from "reactstrap";

const { Text } = Typography;

type SignItemProps = {
  role: string;
  name?: string;
  position?: string;
  inlineName?: boolean;
  locked?: boolean;
  image?: string; // เพิ่มการรับ prop นี้
  mode?: "edit" | "view";
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

  // ถ้าเป็นโหมด "view" แสดงภาพลายเซ็นจาก prop image
  if (mode === "view") {
    return (
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        {image ? (
          <img
            src={`data:image/png;base64,${image}`}
            alt={name}
            style={{
              width: 180,
              height: 80,
              objectFit: "contain",
              borderBottom: "1px dotted #ccc",
            }}
          />
        ) : (
          <div
            style={{
              width: 180,
              height: 80,
              borderBottom: "1px dotted #ccc",
              margin: "0 auto 10px",
            }}
          />
        )}
        <div>
          (ลงชื่อ) {name ? `(${name})` : "................................"}
        </div>
        <div>{role}</div>
        {position && <div>{position}</div>}
      </div>
    );
  }

  // ถ้าเป็นโหมด "edit" ให้แสดง SignatureCanvas
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
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          onEnd={handleEnd}
          canvasProps={{
            style: { width: "100%", height: "100%", display: "block" },
          }}
        />
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
              {".................... "} {name} {" .................... "}
              {role}
            </>
          ) : (
            <>
              {"........................................................ "}
              {role}
            </>
          )}
        </Text>

        {!locked && (
          <Button size="small" danger onClick={clearSignature}>
            ลบลายเซ็น
          </Button>
        )}
      </div>

      {!inlineName && name && (
        <div style={{ marginTop: 4 }}>
          <Text>({name})</Text>
        </div>
      )}
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
  }[]; // เพิ่มการรับลายเซ็นลูกค้า
  customerSignatures?: string[]; // เพิ่ม prop สำหรับลายเซ็นของลูกค้า
  stamp?: string | null;
  mode?: "edit" | "view";
  onSignedAll?: (signatures: Record<string, string>, stamp?: string | null) => void;
};

export default function ContractSignSection({
  signatures = [],
  customerSignatures = [], // รับลายเซ็นของลูกค้า
  stamp: defaultStamp = null,
  mode = "edit",
  onSignedAll,
}: ContractSignSectionProps) {
  const [stamp, setStamp] = useState<string | null>(defaultStamp);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [signData, setSignData] = useState<Record<string, string>>({});

  const handleSigned = (dataUrl: string, role: string) => {
    const newData = { ...signData, [role]: dataUrl };
    setSignData(newData);
    onSignedAll?.(newData, stamp);
  };

  return (
    <div className="signature-section" style={{ marginTop: 40 }}>
      <Row
        className="mb-5"
        style={{
          marginBottom: 50,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Col md={6}>
          <Row
            align="middle"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
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
            ) : (
              stamp && (
                <img
                  src={stamp}
                  alt="ตราประทับ"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid #e6f4ff",
                  }}
                />
              )
            )}

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

      <Row className="gy-4 gx-4">
        {signatures.map((sig) => (
          <Col md={6} key={sig.id}>
            <SignItem
              role={sig.role}
              name={sig.name}
              position={sig.position}
              image={sig.image} // ส่งลายเซ็นลูกค้ามาจาก API
              mode={mode}
              onSigned={handleSigned}
            />
          </Col>
        ))}
        {/* ถ้ามีลายเซ็นลูกค้าก็แสดง */}
        {customerSignatures.length > 0 && (
          <Col md={6}>
            <SignItem
              role="customer"
              image={customerSignatures[0]} // สมมุติว่ามีแค่ลายเซ็นลูกค้า 1 ลายเซ็น
              mode="view"
            />
          </Col>
        )}
      </Row>
    </div>
  );
}
