// src/pages/customer/DisplayContract.tsx
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Modal, Spin, Typography, Tag, Space } from "antd";
import ContractRenderer from "../../components/ContractRenderer";
import type { ContractConfig } from "../../types/contract";

type SignMeta = { name: string; position: string };
type SignMetaMap = Record<string, SignMeta>;

const isCustomerRole = (role: string) =>
  role === "customer_director" || role === "customer_witness";

export default function DisplayContract() {
  const { documentId } = useParams();

  const [config, setConfig] = useState<ContractConfig | null>(null);
  const [status, setStatus] = useState<string>("PENDING");

  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [customerStamp, setCustomerStamp] = useState<string | null>(null);
  const [customerMeta, setCustomerMeta] = useState<SignMetaMap>({});

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

        const cfg: ContractConfig = data.config;

        setConfig(cfg);
        setStatus(data.status || "PENDING");

        const locked =
          data.status === "CUSTOMER_SIGNED" || data.status === "COMPLETED";
        setSubmitted(locked);

        const init: SignMetaMap = {};
        (cfg.signatures || [])
          .filter((s) => isCustomerRole(s.role))
          .forEach((s) => {
            init[s.role] = {
              name: (s.name || "").trim(),
              position: (s.position || "").trim(),
            };
          });
        setCustomerMeta(init);
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
  }, [apiBase, documentId, modal]);

  const readOnly = useMemo(
    () => submitting || submitted,
    [submitting, submitted],
  );

  const updateCustomerMeta = (role: string, patch: Partial<SignMeta>) => {
    setCustomerMeta((prev) => {
      const cur = prev[role] || { name: "", position: "" };
      return { ...prev, [role]: { ...cur, ...patch } };
    });
  };

  const handleSubmitSignature = async () => {
    if (!documentId) return;
    if (submitting || submitted) return;
    if (!config) return;

    const payloadSignatures: Record<
      string,
      { image: string; signer_name?: string; signer_position?: string }
    > = {};

    for (const role of Object.keys(signatures)) {
      const image = signatures[role];
      if (!image) continue;

      const meta = customerMeta[role];
      payloadSignatures[role] = {
        image,
        signer_name: meta?.name?.trim() || undefined,
        signer_position: meta?.position?.trim() || undefined,
      };
    }

    const payload: any = { signatures: payloadSignatures };
    if (customerStamp) payload.customer_stamp = customerStamp;

    const hasAnySignature = Object.keys(payloadSignatures).length > 0;
    const hasStamp = !!customerStamp;
    if (!hasAnySignature && !hasStamp) {
      modal.warning({
        title: "ยังไม่ได้เซ็น",
        content: "กรุณาเซ็นก่อนส่งกลับบริษัท",
        okText: "เข้าใจแล้ว",
        centered: true,
      });
      return;
    }

    for (const role of Object.keys(payloadSignatures)) {
      if (!isCustomerRole(role)) continue;
      const meta = customerMeta[role] || { name: "", position: "" };
      if (!meta.name.trim() || !meta.position.trim()) {
        modal.warning({
          title: "กรอกข้อมูลผู้ลงนามให้ครบ",
          content: "กรุณากรอก “ชื่อ” และ “ตำแหน่ง” ก่อนยืนยันส่งเอกสาร",
          okText: "เข้าใจแล้ว",
          centered: true,
        });
        return;
      }
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
      const res = await fetch(
        `${apiBase}/api/contracts/${documentId}/customer-sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

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

  const customerRoles = (config.signatures || [])
    .filter((s) => isCustomerRole(s.role))
    .map((s) => s.role);

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
        <Card
          style={{ marginBottom: 16, borderRadius: 14 }}
          title={
            <Space>
              <b>ข้อมูลผู้ลงนาม (ฝั่งลูกค้า)</b>
              {readOnly ? (
                <Tag color="default">ล็อกแล้ว</Tag>
              ) : (
                <Tag color="blue">กรอกให้ครบ</Tag>
              )}
            </Space>
          }
        >
          <Typography.Paragraph style={{ marginBottom: 12, opacity: 0.85 }}>
            กรุณากรอก “ชื่อ” และ “ตำแหน่ง” ให้ตรงกับผู้ลงนามในเอกสาร
          </Typography.Paragraph>

          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {customerRoles.map((role) => {
              const meta = customerMeta[role] || { name: "", position: "" };
              const label =
                role === "customer_director"
                  ? "กรรมการ (ลูกค้า)"
                  : role === "customer_witness"
                    ? "พยาน (ลูกค้า)"
                    : role;

              return (
                <Card
                  key={role}
                  size="small"
                  style={{ borderRadius: 12, background: "#fafafa" }}
                  title={<Tag color="blue">{label}</Tag>}
                >
                  <Space direction="vertical" size={10} style={{ width: "100%" }}>
                    <Input
                      placeholder="ชื่อผู้ลงนาม"
                      value={meta.name}
                      disabled={readOnly}
                      onChange={(e) =>
                        updateCustomerMeta(role, { name: e.target.value })
                      }
                      style={{ borderRadius: 10, height: 40 }}
                    />
                    <Input
                      placeholder="ตำแหน่ง"
                      value={meta.position}
                      disabled={readOnly}
                      onChange={(e) =>
                        updateCustomerMeta(role, { position: e.target.value })
                      }
                      style={{ borderRadius: 10, height: 40 }}
                    />
                  </Space>
                </Card>
              );
            })}
          </Space>
        </Card>

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
            <div style={{ marginTop: 10, opacity: 0.75 }}>สถานะ: {status}</div>
          )}
        </div>
      </div>
    </div>
  );
}
