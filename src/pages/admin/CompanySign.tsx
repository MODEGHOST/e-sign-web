import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button, message } from "antd";
import ContractRenderer from "../../components/ContractRenderer";
import type { ContractConfig } from "../../types/contract";

type ApiSignature = {
  role: string;
  signature_image: string; // dataURL: "data:image/png;base64,..."
};

export default function CompanySign() {
  const { documentId } = useParams();

  const [config, setConfig] = useState<ContractConfig | null>(null);

  // ลายเซ็นที่บริษัทเซ็น (ส่งกลับไป)
  const [companySigned, setCompanySigned] = useState<Record<string, string>>({});

  // ✅ ลายเซ็นลูกค้า: map role -> dataURL
  const [customerSigMap, setCustomerSigMap] = useState<Record<string, string>>(
    {}
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;

    (async () => {
      try {
        setLoading(true);

        const [contractRes, sigRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contracts/${documentId}`),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contracts/${documentId}/signatures`),
        ]);

        if (!contractRes.ok) throw new Error("ไม่สามารถดึงข้อมูลสัญญาได้");
        if (!sigRes.ok) throw new Error("ไม่สามารถดึงลายเซ็นลูกค้าได้");

        const contractData = await contractRes.json();
        const sigData: { signatures: ApiSignature[] } = await sigRes.json();

        setConfig(contractData.config);

        // ✅ ทำเป็น map role->signature_image
        const map: Record<string, string> = {};
        (sigData.signatures || []).forEach((s) => {
          if (s?.role && s?.signature_image) map[s.role] = s.signature_image;
        });
        setCustomerSigMap(map);
      } catch (err: any) {
        console.error("Error:", err);
        message.error(err?.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    })();
  }, [documentId]);

  const handleCompanySign = async () => {
    if (!Object.keys(companySigned).length) {
      message.warning("กรุณาเซ็นก่อนยืนยัน ❗");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/contracts/${documentId}/company-sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signatures: companySigned }),
        }
      );

      if (res.ok) message.success("บริษัทเซ็นเอกสารสำเร็จ ✅");
      else message.error("เซ็นเอกสารไม่สำเร็จ ❌");
    } catch {
      message.error("เกิดข้อผิดพลาดระหว่างส่งข้อมูล");
    }
  };

  if (loading || !config) return <div>กำลังโหลดเอกสาร...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <ContractRenderer
        config={config}
        mode="edit" // บริษัทต้องเซ็นได้
        onSignedAll={(data) => setCompanySigned(data)}
        customerSignatureMap={customerSigMap} // ✅ ส่งเป็น map
      />

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Button type="primary" onClick={handleCompanySign}>
          🏢 บริษัทเซ็นและยืนยัน
        </Button>
      </div>
    </div>
  );
}
