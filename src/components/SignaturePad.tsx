import { Button, Typography } from "antd";
import SignatureCanvas from "react-signature-canvas";
import { useRef } from "react";

const { Text } = Typography;

type Props = {
  onSubmit: (signature: string) => void;
  signerLabel?: string;
};

export default function SignaturePad({
  onSubmit,
  signerLabel = "ผู้ว่าจ้าง",
}: Props) {
  const sigRef = useRef<SignatureCanvas>(null);

  const handleSubmit = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    onSubmit(
      sigRef.current.getTrimmedCanvas().toDataURL("image/png")
    );
  };

  return (
    <div style={{ textAlign: "center" }}>
      <Text strong>ลงลายมือชื่อ {signerLabel}</Text>

      <div
        style={{
          border: "1px solid #000",
          padding: 10,
          width: 520,
          margin: "8px auto",
        }}
      >
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            width: 480,
            height: 150,
          }}
        />
      </div>

      <div style={{ width: 520, margin: "0 auto", textAlign: "left" }}>
        ลงชื่อ ........................................................<br />
        วันที่ ........................................................
      </div>

      <div style={{ marginTop: 12 }}>
        <Button size="small" onClick={() => sigRef.current?.clear()}>
          ล้าง
        </Button>
        <Button
          size="small"
          type="primary"
          style={{ marginLeft: 8 }}
          onClick={handleSubmit}
        >
          ยืนยันเซ็น
        </Button>
      </div>
    </div>
  );
}
