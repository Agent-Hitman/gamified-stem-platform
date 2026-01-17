import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics() {
  const data = {
    labels: ["Algebra", "Physics"],
    datasets: [
      {
        label: "Score",
        data: [localStorage.getItem("quizScore") || 0, 0],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  return (
    <div>
      <h2>Performance Analytics</h2>
      <Bar data={data} />
    </div>
  );
}
