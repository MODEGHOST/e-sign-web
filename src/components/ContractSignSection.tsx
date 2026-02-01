import { Typography, Button, Input } from "antd";
import SignatureCanvas from "react-signature-canvas";
import { useMemo, useRef, useState } from "react";
import { Row, Col } from "reactstrap";
import companyStamp from "../assets/BBMMUUUU.png";

const { Text } = Typography;

type SignedPayloadItem = {
  image: string;
  signer_name?: string;
  signer_position?: string;
};

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

// ✅ รองรับ customerSignatureMap เป็น string หรือ object
const pickImg = (v: any) => {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.image || v.signature_image || "";
};
const pickName = (v: any) => {
  if (!v || typeof v === "string") return "";
  return v.signer_name || v.name || "";
};
const pickPos = (v: any) => {
  if (!v || typeof v === "string") return "";
  return v.signer_position || v.position || "";
};

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

  /**
   * ✅ FIX บัค: ลูกค้าเซ็นแล้วชื่อ role ที่ inlineName=false ไม่แสดง
   * - ใน UI (edit/view) ให้โชว์ชื่อเสมอถ้ามี
   * - ใน final (พิมพ์/PDF) ค่อยเคารพ inlineName ตามเดิม
   */
  const showNameInline = mode === "final" ? !!inlineName : true;

  const nameLine = (
    <Text style={{ fontSize: 14 }}>
      (ลงชื่อ){" "}
      {showNameInline && name?.trim() ? (
        <>
          {".......... "} {name.trim()} {" .......... "}
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
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          ) : null}
        </div>
        <div style={{ marginTop: 10 }}>{nameLine}</div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 26 }}>
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
            canvasProps={{
              style: { width: "100%", height: "100%", display: "block" },
            }}
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
          gap: 10,
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

  // ✅ ส่ง object ต่อ role ให้ backend เก็บ name/position ได้
  onSignedAll?: (
    signatures: Record<string, SignedPayloadItem>,
    stamp?: string | null,
  ) => void;

  // ✅ รับได้ทั้ง string/object
  customerSignatureMap?: Record<string, SignedPayloadItem | string>;

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
  const [signData, setSignData] = useState<Record<string, SignedPayloadItem>>({});
  const isFinal = mode === "final";

  const canCustomerUploadStamp = viewFor === "customer" && mode === "edit";
  const showCustomerStampBox =
    viewFor !== "customer" || mode !== "edit" || canCustomerUploadStamp;

  const handleSigned = (dataUrl: string, role: string) => {
    setSignData((prev) => {
      const cur = prev[role] || { image: "" };
      const next: Record<string, SignedPayloadItem> = {
        ...prev,
        [role]: { ...cur, image: dataUrl },
      };
      onSignedAll?.(next, null);
      return next;
    });
  };

  const updateMeta = (
    role: string,
    patch: Partial<Pick<SignedPayloadItem, "signer_name" | "signer_position">>,
  ) => {
    setSignData((prev) => {
      const cur = prev[role] || { image: "" };
      const next: Record<string, SignedPayloadItem> = {
        ...prev,
        [role]: { ...cur, ...patch },
      };
      onSignedAll?.(next, null);
      return next;
    });
  };

  const handleCustomerStampUpload = async (file: File) => {
    const dataUrl = await readAsDataUrl(file);
    onCustomerStampChange?.(dataUrl);
  };

  const filtered = useMemo(() => {
    if (viewFor === "customer") return signatures.filter((s) => isCustomerRole(s.role));
    if (viewFor === "company") return signatures; // บริษัทเห็นทั้งหมด แต่ edit เฉพาะ company role
    return signatures;
  }, [signatures, viewFor]);

  const resolveItemMode = (
    role: string,
    base: "edit" | "view" | "final",
  ): "edit" | "view" | "final" => {
    if (base === "final") return "final";
    if (viewFor === "customer") return isCustomerRole(role) ? "edit" : "view";
    if (viewFor === "company") return isCompanyRole(role) ? "edit" : "view";
    return isCompanyRole(role) ? "edit" : "view";
  };

  return (
    <div className="signature-section" style={{ marginTop: 40 }}>
      {showSectionStamp && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Text strong>ตราบริษัท</Text>
            <img
              src={companyStamp}
              alt="ตราประทับบริษัท"
              style={{ width: 120, opacity: 0.95, transform: "rotate(-2deg)" }}
            />
          </div>

          {showCustomerStampBox && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "flex-end",
              }}
            >
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
          // ✅ ของที่ดึงจาก DB (company page) จะมาอยู่ใน customerSignatureMap
          const mapped = customerSignatureMap[sig.role];
          const mappedImg = pickImg(mapped);
          const mappedName = pickName(mapped);
          const mappedPos = pickPos(mapped);

          // ✅ ของที่กรอก/เซ็นบนหน้านั้น ๆ
          const local = signData[sig.role];
          const localImg = local?.image || "";

          // priority: mapped(DB) > local(current) > config
          const img = mappedImg || localImg || sig.image;
          const name = mappedName || local?.signer_name || sig.name;
          const position = mappedPos || local?.signer_position || sig.position;

          let itemMode = resolveItemMode(sig.role, mode);

          const isMapped = !!mappedImg;
          if (itemMode !== "final" && isMapped) itemMode = "view";

          const locked = itemMode !== "edit" || isMapped || isFinal;

          // ✅ meta input ให้กรอกเฉพาะฝั่งลูกค้าและเฉพาะตอน edit
          const showMetaInputs =
            itemMode === "edit" && viewFor === "customer" && isCustomerRole(sig.role);

          return (
            <Col md={6} key={sig.id}>
              <SignItem
                role={sig.role}
                name={name}
                position={position}
                inlineName={sig.inlineName}
                image={img}
                mode={itemMode}
                locked={locked}
                onSigned={locked ? undefined : handleSigned}
              />

              {showMetaInputs && (
                <div style={{ marginTop: -18, marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Input
                      placeholder="ชื่อผู้ลงนาม"
                      value={signData[sig.role]?.signer_name ?? ""}
                      onChange={(e) =>
                        updateMeta(sig.role, { signer_name: e.target.value })
                      }
                      style={{ borderRadius: 10, height: 40 }}
                    />
                    <Input
                      placeholder="ตำแหน่ง"
                      value={signData[sig.role]?.signer_position ?? ""}
                      onChange={(e) =>
                        updateMeta(sig.role, { signer_position: e.target.value })
                      }
                      style={{ borderRadius: 10, height: 40 }}
                    />
                  </div>
                </div>
              )}
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
