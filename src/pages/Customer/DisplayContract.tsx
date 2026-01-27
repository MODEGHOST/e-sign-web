// DisplayContract.tsx
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Spin, Typography } from "antd";
import ContractRenderer from "../../components/ContractRenderer";
import type { ContractConfig } from "../../types/contract";

export default function DisplayContract() {
  const { documentId } = useParams();

  const [config, setConfig] = useState<ContractConfig | null>(null);
  const [status, setStatus] = useState<string>("PENDING");

  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [customerStamp, setCustomerStamp] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [modal, contextHolder] = Modal.useModal();

  const apiBase = import.meta.env.VITE_API_BASE_URL as string;

  useEffect(() => {
    if (!documentId) return;

    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const res = await fetch(`${apiBase}/api/contracts/${documentId}`);
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลสัญญาได้");

        const data = await res.json();
        if (!alive) return;

        setConfig(data.config);
        setStatus(data.status || "PENDING");

        const locked = data.status === "CUSTOMER_SIGNED" || data.status === "COMPLETED";
        setSubmitted(locked);
      } catch (e: any) {
        modal.error({
          title: "เกิดข้อผิดพลาด",
          content: e?.message || "ไม่สามารถโหลดข้อมูลได้",
          okText: "ปิด",
          centered: true,
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [apiBase, documentId]);

  const readOnly = useMemo(() => submitting || submitted, [submitting, submitted]);

  const handleSubmitSignature = async () => {
    if (!documentId) return;
    if (submitting || submitted) return;

    const payloadSignatures: Record<string, string> = { ...signatures };
    if (customerStamp) payloadSignatures["customer_stamp"] = customerStamp;

    if (!Object.keys(payloadSignatures).length) {
      modal.warning({
        title: "ยังไม่ได้เซ็น",
        content: "กรุณาเซ็นก่อนส่งกลับบริษัท",
        okText: "เข้าใจแล้ว",
        centered: true,
      });
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      modal.confirm({
        title: "ยืนยันการส่งลายเซ็น",
        content: "หลังยืนยัน หน้านี้จะถูกล็อกและไม่สามารถแก้ไขลายเซ็นได้",
        okText: "ยืนยันส่ง",
        cancelText: "ยกเลิก",
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
        centered: true,
      });
    });

    if (!confirmed) return;

    const loadingRef = modal.info({
      title: "กำลังส่งลายเซ็น...",
      content: "กรุณารอสักครู่ ระบบกำลังบันทึกข้อมูล",
      okButtonProps: { style: { display: "none" } },
      maskClosable: false,
      closable: false,
      centered: true,
    });

    setSubmitting(true);

    try {
      const res = await fetch(`${apiBase}/api/contracts/${documentId}/customer-sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatures: payloadSignatures }),
      });

      loadingRef.destroy();

      if (res.ok) {
        modal.success({
          title: "สำเร็จ ✅",
          content: "ส่งลายเซ็นกลับเรียบร้อยแล้ว",
          okText: "ปิด",
          centered: true,
        });
        setSubmitted(true);
        setStatus("CUSTOMER_SIGNED");
        return;
      }

      if (res.status === 409) {
        modal.info({
          title: "ส่งไปแล้ว ✅",
          content: "เอกสารนี้ถูกส่งลายเซ็นไปแล้ว ระบบจะล็อกหน้านี้ให้",
          okText: "ปิด",
          centered: true,
        });
        setSubmitted(true);
        setStatus("CUSTOMER_SIGNED");
        return;
      }

      let msg = "ส่งลายเซ็นไม่สำเร็จ ❌";
      try {
        const j = await res.json();
        msg = j?.message || msg;
      } catch {}

      modal.error({
        title: "ไม่สำเร็จ",
        content: msg,
        okText: "ปิด",
        centered: true,
      });
    } catch {
      loadingRef.destroy();
      modal.error({
        title: "เกิดข้อผิดพลาด",
        content: "ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่",
        okText: "ปิด",
        centered: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        {contextHolder}
        <Spin />
        <div style={{ marginTop: 10 }}>
          <Typography.Text>กำลังโหลดเอกสาร...</Typography.Text>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        {contextHolder}
        <Typography.Text>ไม่พบข้อมูลเอกสาร</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ margin: "0 auto", maxWidth: 900, position: "relative" }}>
      {contextHolder}

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

          {submitted && (
            <div style={{ marginTop: 10, opacity: 0.75 }}>
              สถานะ: {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
