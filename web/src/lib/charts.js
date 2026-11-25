// Registers Chart.js once; import chart components from here instead of react-chartjs-2 directly.
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);
Chart.defaults.font.family = 'Poppins, sans-serif';

export { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
