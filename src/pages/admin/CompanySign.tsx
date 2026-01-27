import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Spin, Typography } from "antd";
import ContractRenderer from "../../components/ContractRenderer";
import type { ContractConfig } from "../../types/contract";

type ApiSignature = { role: string; signature_image: string };

export default function CompanySign() {
  const { documentId } = useParams();

  const [config, setConfig] = useState<ContractConfig | null>(null);
  const [status, setStatus] = useState<string>("PENDING");

  const [companySigned, setCompanySigned] = useState<Record<string, string>>({});
  const [customerSigMap, setCustomerSigMap] = useState<Record<string, string>>(
    {}
  );

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

        const [contractRes, sigRes] = await Promise.all([
          fetch(`${apiBase}/api/contracts/${documentId}`),
          fetch(`${apiBase}/api/contracts/${documentId}/signatures`),
        ]);

        if (!contractRes.ok) throw new Error("ไม่สามารถดึงข้อมูลสัญญาได้");
        if (!sigRes.ok) throw new Error("ไม่สามารถดึงลายเซ็นลูกค้าได้");

        const contractData = await contractRes.json();
        const sigData: { signatures: ApiSignature[] } = await sigRes.json();

        if (!alive) return;

        setConfig(contractData.config);
        setStatus(contractData.status || "PENDING");

        const locked =
          contractData.status === "COMPLETED" ||
          contractData.status === "COMPANY_SIGNED";
        setSubmitted(locked);

        const map: Record<string, string> = {};
        (sigData.signatures || []).forEach((s) => {
          if (s?.role && s?.signature_image) map[s.role] = s.signature_image;
        });
        setCustomerSigMap(map);
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

  const readOnly = useMemo(
    () => submitting || submitted,
    [submitting, submitted]
  );

  const canSubmit = useMemo(
    () => Object.keys(companySigned).length > 0,
    [companySigned]
  );

  const handleCompanySign = async () => {
    if (!documentId) return;
    if (readOnly) return;

    if (!canSubmit) {
      modal.warning({
        title: "ยังไม่ได้เซ็น",
        content: "กรุณาเซ็นให้ครบก่อน แล้วค่อยกด “บริษัทเซ็นและยืนยัน”",
        okText: "เข้าใจแล้ว",
        centered: true,
      });
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      modal.confirm({
        title: "ยืนยันการเซ็นเอกสาร",
        content: "หลังยืนยัน หน้านี้จะถูกล็อก และระบบจะส่ง PDF ให้ผู้เกี่ยวข้อง",
        okText: "ยืนยันเซ็น",
        cancelText: "ยกเลิก",
        centered: true,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!confirmed) return;

    const loadingRef = modal.info({
      title: "กำลังส่งข้อมูล...",
      content: "กรุณารอสักครู่ ระบบกำลังบันทึกการเซ็นของบริษัท",
      okButtonProps: { style: { display: "none" } },
      centered: true,
      maskClosable: false,
      closable: false,
    });

    setSubmitting(true);

    try {
      const res = await fetch(
        `${apiBase}/api/contracts/${documentId}/company-sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signatures: companySigned }),
        }
      );

      loadingRef.destroy();

      if (res.ok) {
        modal.success({
          title: "สำเร็จ ✅",
          content: "บริษัทเซ็นเอกสารเรียบร้อยแล้ว หน้านี้ถูกล็อกแล้ว",
          okText: "ปิด",
          centered: true,
        });

        setSubmitted(true);
        setStatus("COMPLETED");
        return;
      }

      let msg = "เซ็นเอกสารไม่สำเร็จ ❌";
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

  if (loading || !config) {
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

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
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
          onSignedAll={(data) => {
            if (readOnly) return;
            setCompanySigned(data);
          }}
          customerSignatureMap={customerSigMap}
        />

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Button
            type="primary"
            onClick={handleCompanySign}
            loading={submitting}
            disabled={readOnly}
          >
            {submitted ? "✅ บริษัทเซ็นเรียบร้อยแล้ว" : "🏢 บริษัทเซ็นและยืนยัน"}
          </Button>

          {submitted && (
            <div style={{ marginTop: 10, opacity: 0.75 }}>สถานะ: {status}</div>
          )}
        </div>
      </div>
    </div>
  );
}
