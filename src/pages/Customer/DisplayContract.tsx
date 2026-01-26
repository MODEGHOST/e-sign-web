import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button, message } from "antd";
import ContractRenderer from "../../components/ContractRenderer";
import type { ContractConfig } from "../../types/contract";

export default function DisplayContract() {
  const { documentId } = useParams();
  const [config, setConfig] = useState<ContractConfig | null>(null);

  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [customerStamp, setCustomerStamp] = useState<string | null>(null); // ✅ เพิ่ม

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [documentId]);

  const handleSubmitSignature = async () => {
    const payloadSignatures: Record<string, string> = { ...signatures };

    // ✅ แนบตราลูกค้าไปด้วยใน signatures
    if (customerStamp) payloadSignatures["customer_stamp"] = customerStamp;

    if (!Object.keys(payloadSignatures).length) {
      message.warning("กรุณาเซ็นก่อนส่งกลับ ❗");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/contracts/${documentId}/customer-sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signatures: payloadSignatures }),
        }
      );

      if (res.ok) {
        message.success("ส่งลายเซ็นกลับสำเร็จ ✅");
      } else {
        message.error("ส่งลายเซ็นไม่สำเร็จ ❌");
      }
    } catch {
      message.error("เกิดข้อผิดพลาดระหว่างส่งข้อมูล");
    }
  };

  if (loading) return <div>กำลังโหลดเอกสาร...</div>;
  if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;
  if (!config) return null;

  return (
    <div style={{ margin: "0 auto", maxWidth: 900 }}>
      <ContractRenderer
        config={config}
        mode="edit"
        viewFor="customer"
        onSignedAll={(data) => setSignatures(data)}
        // ✅ ส่งตัวจัดการตราลูกค้าเข้าไป
        customerStamp={customerStamp}
        onCustomerStampChange={setCustomerStamp}
      />

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Button type="primary" onClick={handleSubmitSignature}>
          📩 ยืนยันและส่งกลับบริษัท
        </Button>
      </div>
    </div>
  );
}
