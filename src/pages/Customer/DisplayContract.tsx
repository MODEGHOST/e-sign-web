import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button, message } from "antd";
import ContractRenderer from "../../components/ContractRenderer";
import type { ContractConfig } from "../../types/contract";

export default function DisplayContract() {
  const { documentId } = useParams();
  const [config, setConfig] = useState<ContractConfig | null>(null);
  const [status, setStatus] = useState<string>("PENDING");

  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [customerStamp, setCustomerStamp] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ เพิ่มสถานะส่ง
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contracts/${documentId}`)
      .then((res) => {
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลสัญญาได้");
        return res.json();
      })
      .then((data) => {
        setConfig(data.config);
        setStatus(data.status || "PENDING");

        // ✅ ล็อกจริงจาก backend (รีเฟรชก็ยังล็อก)
        const locked =
          data.status === "CUSTOMER_SIGNED" || data.status === "COMPLETED";
        setSubmitted(locked);

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [documentId]);

  const handleSubmitSignature = async () => {
    if (!documentId) return;
    if (submitting || submitted) return;

    const payloadSignatures: Record<string, string> = { ...signatures };
    if (customerStamp) payloadSignatures["customer_stamp"] = customerStamp;

    if (!Object.keys(payloadSignatures).length) {
      message.warning("กรุณาเซ็นก่อนส่งกลับ ❗");
      return;
    }

    // ✅ แจ้ง “กำลังส่ง...” ค้างไว้
    const hide = message.loading("กำลังส่งลายเซ็น...", 0);

    try {
      setSubmitting(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/contracts/${documentId}/customer-sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signatures: payloadSignatures }),
        }
      );

      hide();

      if (res.ok) {
        message.success("ส่งลายเซ็นกลับสำเร็จ ✅");
        setSubmitted(true);
        setStatus("CUSTOMER_SIGNED");
      } else if (res.status === 409) {
        // ✅ เคยส่งแล้วก็ล็อกเหมือนกัน
        message.info("เอกสารนี้ถูกส่งลายเซ็นไปแล้ว ✅");
        setSubmitted(true);
        setStatus("CUSTOMER_SIGNED");
      } else {
        message.error("ส่งลายเซ็นไม่สำเร็จ ❌");
      }
    } catch {
      hide();
      message.error("เกิดข้อผิดพลาดระหว่างส่งข้อมูล");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>กำลังโหลดเอกสาร...</div>;
  if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;
  if (!config) return null;

  // ✅ ตอนกำลังส่ง หรือส่งแล้ว => ห้ามแก้/ห้ามกด
  const readOnly = submitting || submitted;

  return (
    <div style={{ margin: "0 auto", maxWidth: 900, position: "relative" }}>
      {/* ✅ กันผู้ใช้คลิก/แก้ไขทั้งหน้า */}
      {readOnly && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.55)",
            zIndex: 10,
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <ContractRenderer
          config={config}
          mode={readOnly ? "view" : "edit"}
          viewFor="customer"
          onSignedAll={(data) => {
            if (readOnly) return;
            setSignatures(data);
          }}
          customerStamp={customerStamp}
          onCustomerStampChange={(v) => {
            if (readOnly) return;
            setCustomerStamp(v);
          }}
        />

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Button
            type="primary"
            onClick={handleSubmitSignature}
            loading={submitting}
            disabled={readOnly}
          >
            {submitted ? "✅ ส่งกลับเรียบร้อยแล้ว" : "📩 ยืนยันและส่งกลับบริษัท"}
          </Button>

          {/* (ไม่จำเป็น แต่ช่วยผู้ใช้) */}
          {submitted && (
            <div style={{ marginTop: 10, opacity: 0.75 }}>
              สถานะ: {status} — หน้านี้ถูกล็อกแล้ว
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
