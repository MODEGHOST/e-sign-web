// src/components/ContractSignSection.tsx
import { Typography, Button } from "antd";
import SignatureCanvas from "react-signature-canvas";
import { useRef, useState } from "react";
import { Row, Col } from "reactstrap";
import companyStamp from "../assets/BBMMUUUU.png";

const { Text } = Typography;

const toImgSrc = (sig?: string) =>
  !sig ? "" : sig.startsWith("data:image") ? sig : `data:image/png;base64,${sig}`;

const isCustomerRole = (role: string) => role.startsWith("customer_");
const isCompanyRole = (role: string) => role.startsWith("company_");

const roleLabel = (role: string) => {
  switch (role) {
    case "company_director":
      return "กรรมการ (บริษัท)";
    case "company_witness":
      return "พยาน (บริษัท)";
    case "customer_director":
      return "กรรมการ (ลูกค้า)";
    case "customer_witness":
      return "พยาน (ลูกค้า)";
    default:
      return role;
  }
};

const displayRole = (role: string, position?: string) =>
  position?.trim() ? position.trim() : roleLabel(role);

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    r.readAsDataURL(file);
  });

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
    if (!sigRef.current || !onSigned) return;
    onSigned(sigRef.current.toDataURL(), role);
  };

  const boxStyle: React.CSSProperties = {
    width: "100%",
    height: mode === "final" ? 90 : 140,
    border: mode === "final" ? undefined : "2px solid #d9d9d9",
    background: "#fff",
    borderRadius: mode === "final" ? undefined : 10,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const nameLine = (
    <Text style={{ fontSize: 14 }}>
      (ลงชื่อ){" "}
      {inlineName && name ? (
        <>
          {".......... "} {name} {" .......... "}
        </>
      ) : (
        <>{"........................................................ "}</>
      )}{" "}
      {displayRole(role, position)}
    </Text>
  );

  if (mode === "final") {
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={boxStyle}>
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
        <div style={{ marginTop: 6 }}>{nameLine}</div>
      </div>
    );
  }

  if (mode === "view") {
    return (
      <div style={{ marginBottom: 40 }}>
        <div style={boxStyle}>
          {image ? (
            <img
              src={toImgSrc(image)}
              alt={name ?? role}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : null}
        </div>
        <div style={{ marginTop: 10 }}>{nameLine}</div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ ...boxStyle, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        {locked ? (
          image ? (
            <img
              src={toImgSrc(image)}
              alt={name ?? role}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
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
        {nameLine}
        {!locked && (
          <Button size="small" danger onClick={clearSignature}>
            ลบลายเซ็น
          </Button>
        )}
      </div>
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
  mode?: "edit" | "view" | "final";
  onSignedAll?: (signatures: Record<string, string>, stamp?: string | null) => void;
  customerSignatureMap?: Record<string, string>;
  viewFor?: "customer" | "company" | "all";

  customerStamp?: string | null;
  onCustomerStampChange?: (dataUrl: string | null) => void;

  showSectionStamp?: boolean;
};

export default function ContractSignSection({
  signatures = [],
  mode = "edit",
  onSignedAll,
  customerSignatureMap = {},
  viewFor = "all",
  customerStamp = null,
  onCustomerStampChange,
  showSectionStamp = true,
}: ContractSignSectionProps) {
  const [signData, setSignData] = useState<Record<string, string>>({});
  const isFinal = mode === "final";

  const canCustomerUploadStamp = viewFor === "customer" && mode === "edit";
  const showCustomerStampBox = viewFor !== "customer" || mode !== "edit" || canCustomerUploadStamp;

  const handleSigned = (dataUrl: string, role: string) => {
    const next = { ...signData, [role]: dataUrl };
    setSignData(next);

    const merged = customerStamp ? { ...next, customer_stamp: customerStamp } : next;
    onSignedAll?.(merged, null);
  };

  const handleCustomerStampUpload = async (file: File) => {
    const dataUrl = await readAsDataUrl(file);
    onCustomerStampChange?.(dataUrl);

    const merged = { ...signData, customer_stamp: dataUrl };
    onSignedAll?.(merged, null);
  };

  const filtered = signatures.filter((s) => (viewFor === "customer" ? isCustomerRole(s.role) : true));

  const resolveItemMode = (role: string, base: "edit" | "view" | "final"): "edit" | "view" | "final" => {
    if (base === "final") return "final";
    if (viewFor === "customer") return isCustomerRole(role) ? "edit" : "view";
    if (viewFor === "company") return isCompanyRole(role) ? "edit" : "view";
    return isCompanyRole(role) ? "edit" : "view";
  };

  return (
    <div className="signature-section" style={{ marginTop: 40 }}>
      {showSectionStamp && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Text strong>ตราบริษัท</Text>
            <img
              src={companyStamp}
              alt="ตราประทับบริษัท"
              style={{ width: 120, opacity: 0.95, transform: "rotate(-2deg)" }}
            />
          </div>

          {showCustomerStampBox && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <Text strong>ตราลูกค้า</Text>

              {canCustomerUploadStamp ? (
                <label style={{ cursor: "pointer" }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      await handleCustomerStampUpload(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  <span
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #d9d9d9",
                      borderRadius: 8,
                      display: "inline-block",
                    }}
                  >
                    อัปโหลดตราลูกค้า
                  </span>
                </label>
              ) : null}

              {customerStamp ? (
                <img
                  src={customerStamp}
                  alt="ตราลูกค้า"
                  style={{ width: 120, opacity: 0.95, transform: "rotate(1deg)" }}
                />
              ) : (
                <span style={{ color: "#999" }}>ยังไม่อัปโหลด</span>
              )}
            </div>
          )}
        </div>
      )}

      <Row className="gy-4 gx-4">
        {filtered.map((sig) => {
          const mappedImg = customerSignatureMap[sig.role];
          const img = mappedImg || sig.image;
          const isMapped = !!mappedImg;

          let itemMode = resolveItemMode(sig.role, mode);
          if (itemMode !== "final" && isMapped) itemMode = "view";

          const locked = itemMode !== "edit" || isMapped || isFinal;

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
                onSigned={locked ? undefined : handleSigned}
              />
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
