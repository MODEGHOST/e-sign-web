import { Button } from "antd";
import { useNavigate } from "react-router-dom"; 
import { Typography } from "antd"; 
import "../../styles/a4.css";

const { Title, Text } = Typography;

export default function ContractDocument() {
  const navigate = useNavigate(); 
  const documentId = "DOC-1765927480028";

  return (
    <div className="a4-page cover-page">
      <div style={{ textAlign: "center", marginTop: 120 }}>
        <Title level={2}>สัญญาจ้างบริการทำบัญชี</Title>

        <div style={{ marginTop: 40 }}>
          <Text strong>ระหว่าง</Text>
        </div>

        <div style={{ marginTop: 20 }}>
          <Text>
            บริษัท ไอแวร์แอนด์ริช จำกัด<br />
            เลขนิติบุคคล 0105567217390
          </Text>
        </div>

        <div style={{ marginTop: 20 }}>
          <Text strong>และ</Text>
        </div>

        <div style={{ marginTop: 20 }}>
          <Text>
            บริษัท บิลด์มีอัพ คอนซัลแทนท์ จำกัด<br />
            เลขนิติบุคคล 0105564068709
          </Text>
        </div>

        <div style={{ marginTop: 60 }}>
          <Text>จัดทำขึ้น ณ วันที่ 1 สิงหาคม 2568</Text>
        </div>

        <div style={{ textAlign: "center", margin: "24px 0" }}>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate(`/sign/${documentId}`)}
          >
            ดูสัญญา
          </Button>
        </div>
      </div>
    </div>
  );
}
