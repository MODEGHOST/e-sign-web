// import { useParams } from "react-router-dom"; // สำหรับรับค่า parameter จาก URL
// import { useEffect, useState } from "react";
// import ContractRenderer from "../../components/ContractRenderer"; // สำหรับแสดงสัญญา
// import type { ContractConfig } from "../../types/contract";

// export default function SignDocument() {
//   const { documentId } = useParams(); // รับ documentId จาก URL
//   const [config, setConfig] = useState<ContractConfig | null>(null);
//   const [loading, setLoading] = useState(true); // ใช้ state สำหรับเช็คว่าโหลดข้อมูลเสร็จแล้วหรือยัง
//   const [error, setError] = useState<string | null>(null); // ใช้ state สำหรับจัดการข้อผิดพลาด

//   // ดึงข้อมูลจาก API โดยใช้ documentId
//   useEffect(() => {
//     if (documentId) {
//       setLoading(true); // เริ่มโหลดข้อมูล
//       fetch(`http://localhost:4000/api/contracts/${documentId}`)
//         .then((res) => {
//           if (!res.ok) {
//             throw new Error('ไม่สามารถดึงข้อมูลสัญญาได้');
//           }
//           return res.json();
//         })
//         .then((data) => {
//           setConfig(data.config);
//           setLoading(false); // โหลดข้อมูลเสร็จแล้ว
//         })
//         .catch((err) => {
//           setError(err.message); // ถ้ามีข้อผิดพลาดในการดึงข้อมูล
//           setLoading(false);
//         });
//     }
//   }, [documentId]);

//   // ถ้าเริ่มต้นยังไม่มีข้อมูลให้แสดงข้อความ Loading...
//   if (loading) return <div>Loading...</div>;

//   // ถ้ามีข้อผิดพลาดในการดึงข้อมูล
//   if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;

//   // ถ้าข้อมูลพร้อมแล้วแสดง ContractRenderer
//   return <ContractRenderer config={config!} />; // ใช้ config! เพราะเราได้ทำการตรวจสอบแล้วว่าไม่เป็น null
// }
