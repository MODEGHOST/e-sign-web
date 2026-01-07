import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button, message } from "antd";
import ContractRenderer from "../../components/ContractRenderer";
import type { ContractConfig } from "../../types/contract";

export default function DisplayContract() {
  const { documentId } = useParams();
  const [config, setConfig] = useState<ContractConfig | null>(null);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (documentId) {
      setLoading(true);
      fetch(`http://localhost:4000/api/contracts/${documentId}`)
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
    }
  }, [documentId]);

  const handleSubmitSignature = async () => {
    if (!Object.keys(signatures).length) {
      message.warning("กรุณาเซ็นก่อนส่งกลับ ❗");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:4000/api/contracts/${documentId}/customer-sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signatures }),
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
      {/* ให้ลูกค้าเซ็นตรงในเอกสารจริง */}
      <ContractRenderer
        config={config}
        mode="edit"
        viewFor="customer"
        onSignedAll={(data) => setSignatures(data)}
      />

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Button type="primary" onClick={handleSubmitSignature}>
          📩 ยืนยันและส่งกลับบริษัท
        </Button>
      </div>
    </div>
  );
}
