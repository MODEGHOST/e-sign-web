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
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
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
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
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
  onSignedAll?: (
    signatures: Record<string, string>,
    stamp?: string | null
  ) => void;
  customerSignatureMap?: Record<string, string>;
};

export default function ContractSignSection({
  signatures = [],
  stamp: defaultStamp = null,
  mode = "edit",
  onSignedAll,
  customerSignatureMap = {},
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

      <Row className="gy-4 gx-4">
        {signatures.map((sig) => {
          const mappedImg = customerSignatureMap[sig.role];
          const img = mappedImg || sig.image;
          const isMapped = !!mappedImg;

          let finalMode: "edit" | "view" | "final" = mode;
          if (isFinal) finalMode = "final";
          else if (isMapped) finalMode = "view";

          return (
            <Col md={6} key={sig.id}>
              <SignItem
                role={sig.role}
                name={sig.name}
                position={sig.position}
                inlineName={sig.inlineName}
                image={img}
                mode={finalMode}
                locked={isFinal || isMapped}
                onSigned={isFinal || isMapped ? undefined : handleSigned}
              />
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
