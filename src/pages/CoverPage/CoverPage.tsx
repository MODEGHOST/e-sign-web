import "../../styles/a4.css";
import coverImage from "../../assets/Cover_Final.png";

export default function CoverPage() {
  return (
    <div
      className="a4-page cover-page"
      style={{
        width: "210mm",
        height: "297mm",
        padding: 0,
        overflow: "hidden",
      }}
    >
      <img
        src={coverImage}
        alt="หน้าปกสัญญา"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
}
