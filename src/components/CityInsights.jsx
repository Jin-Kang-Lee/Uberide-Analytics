import { fetchCityInsights } from "../services/api";

useEffect(() => {
  const loadData = async () => {
    try {
      const data = await fetchCityInsights();
      setCityData(data);
    } catch (err) {
      console.error("❌ Error fetching city insights:", err);
    }
  };
  loadData();
}, []);
