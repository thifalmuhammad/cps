import React, { useState, useEffect } from 'react';
import { districtAPI } from '../services/api';
import Card from '../components/Card';
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer } from 'lucide-react';

export default function WeatherPage() {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState(null);
  const [yearlyWeather, setYearlyWeather] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [availableYears, setAvailableYears] = useState([]);

  const generateLevel4Codes = (level3Code) => {
    const codes = [];
    for (let i = 1; i <= 10; i++) {
      codes.push(`${level3Code}.2${String(i).padStart(3, '0')}`);
    }
    return codes;
  };

  const aggregateWeatherData = (results) => {
    const allWeatherData = results.flatMap(r => r.data || []);
    
    if (allWeatherData.length === 0) return null;
    
    const firstData = allWeatherData[0];
    const today = firstData.cuaca?.[0]?.[0];
    
    if (!today) return null;
    
    const temps = allWeatherData
      .map(d => d.cuaca?.[0]?.[0])
      .filter(c => c && c.t)
      .map(c => parseFloat(c.t));
    
    const avgTemp = temps.length > 0 
      ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
      : today.t;
    
    const humidities = allWeatherData
      .map(d => d.cuaca?.[0]?.[0])
      .filter(c => c && c.hu)
      .map(c => parseFloat(c.hu));
    
    const avgHumidity = humidities.length > 0
      ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length)
      : today.hu;
    
    return {
      location: firstData.lokasi,
      temp: avgTemp,
      tempMin: Math.min(...temps).toFixed(1),
      tempMax: Math.max(...temps).toFixed(1),
      humidity: avgHumidity,
      weather: today.weather_desc || today.weather,
      weatherCode: today.weather,
      windSpeed: today.ws,
      windDirection: today.wd_deg,
      datetime: today.datetime
    };
  };

  const fetchWeather = async (districtCode) => {
    try {
      setWeatherLoading(true);
      setError(null);
      
      const level4Codes = generateLevel4Codes(districtCode);
      
      const weatherPromises = level4Codes.map(code => 
        fetch(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${code}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      );
      
      const results = await Promise.all(weatherPromises);
      const validResults = results.filter(r => r && r.data && r.data.length > 0);
      
      if (validResults.length === 0) {
        throw new Error('No weather data available');
      }
      
      const aggregatedWeather = aggregateWeatherData(validResults);
      setWeather(aggregatedWeather);
    } catch (err) {
        console.error(err)
      setError('Failed to fetch weather data from BMKG');
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await districtAPI.getAll();
        setDistricts(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedDistrict(res.data[0]);
          fetchWeather(res.data[0].districtCode);
        }
      } catch (err) {
        setError('Failed to load districts');
      }
    };
    fetchDistricts();
    
    fetch('/yearly-weather.json')
      .then(res => res.json())
      .then(data => {
        setYearlyWeather(data);
        if (data.kecamatan?.[0]?.tahun) {
          const years = data.kecamatan[0].tahun.map(y => y.tahun);
          setAvailableYears(years);
          setSelectedYear(years[years.length - 1]);
        }
      })
      .catch(err => console.log('Yearly weather not loaded:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
    fetchWeather(district.districtCode);
  };

  const getWeatherIcon = (weatherCode) => {
    const code = parseInt(weatherCode);
    if (code === 0) return <Sun className="h-16 w-16 text-slate-900" />;
    if (code >= 60) return <CloudRain className="h-16 w-16 text-slate-900" />;
    return <Cloud className="h-16 w-16 text-slate-900" />;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Weather Forecast</h1>
          <p className="text-sm text-slate-600 mt-1">Check current weather conditions for your districts</p>
        </div>
      </div>

      <div className="px-8 py-8">
        <Card className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select District</label>
            <select
              value={selectedDistrict?.uuid || ''}
              onChange={(e) => {
                const district = districts.find(d => d.uuid === e.target.value);
                handleDistrictChange(district);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {districts.map(district => (
                <option key={district.uuid} value={district.uuid}>
                  {district.districtName}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {weatherLoading ? (
          <Card className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="text-slate-600 mt-4">Loading weather data...</p>
          </Card>
        ) : error ? (
          <Card className="text-center py-12 bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        ) : weather ? (
          <div className="space-y-6">
            <Card variant="elevated" className="bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  {getWeatherIcon(weather.weatherCode)}
                </div>
                <h2 className="text-4xl font-bold text-slate-900 mb-2">
                  {weather.temp}°C
                </h2>
                <p className="text-xl text-slate-600 capitalize">{weather.weather}</p>
                <p className="text-sm text-slate-500 mt-2">{selectedDistrict?.districtName}</p>
              </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card variant="elevated">
                <div className="text-center p-4">
                  <Droplets className="h-8 w-8 text-slate-900 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Humidity</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{weather.humidity}%</p>
                </div>
              </Card>

              <Card variant="elevated">
                <div className="text-center p-4">
                  <Wind className="h-8 w-8 text-slate-900 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Wind Speed</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{weather.windSpeed} km/h</p>
                </div>
              </Card>

              <Card variant="elevated">
                <div className="text-center p-4">
                  <Thermometer className="h-8 w-8 text-slate-900 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Min / Max</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{weather.tempMin}° / {weather.tempMax}°</p>
                </div>
              </Card>
            </div>

            <Card>
              <div className="p-2">
                <p className="text-sm text-slate-600">Data Source</p>
                <p className="text-lg font-bold text-slate-900">BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)</p>
                <p className="text-xs text-slate-500 mt-1">Updated: {new Date(weather.datetime).toLocaleString('id-ID')}</p>
              </div>
            </Card>
          </div>
        ) : null}

        {yearlyWeather && selectedDistrict && (
          <div className="mt-8">
            <Card>
              <div className="border-b border-slate-200 pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Rekap Cuaca Tahunan</h2>
                    <p className="text-sm text-slate-600 mt-1">Data historis cuaca dominan per tahun</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Filter Tahun</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Kecamatan</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase">Cuaca Dominan</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase">Curah Hujan</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase">Suhu Rata-rata</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase">Kelembapan</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase">Kecepatan Angin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {yearlyWeather.kecamatan.sort((a, b) => a.kecamatan.localeCompare(b.kecamatan)).map((district) => {
                      const yearData = district.tahun.find(y => y.tahun === selectedYear);
                      const isSelected = district.kecamatan === selectedDistrict.districtName;
                      return (
                        <tr key={district.kecamatan} className={isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'}>
                          <td className="px-4 py-3">
                            <span className={`text-sm ${isSelected ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                              {district.kecamatan}
                              {isSelected && <span className="ml-2 text-xs text-slate-500">(Terpilih)</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                              yearData?.cuaca_dominan === 'Hujan' 
                                ? 'bg-blue-100 text-blue-800'
                                : yearData?.cuaca_dominan === 'Berawan'
                                ? 'bg-slate-200 text-slate-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {yearData?.cuaca_dominan === 'Hujan' && <CloudRain className="h-4 w-4" />}
                              {yearData?.cuaca_dominan === 'Berawan' && <Cloud className="h-4 w-4" />}
                              {yearData?.cuaca_dominan === 'Cerah' && <Sun className="h-4 w-4" />}
                              {yearData?.cuaca_dominan || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-700">
                            {yearData?.curah_hujan ? `${yearData.curah_hujan} mm` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-700">
                            {yearData?.suhu_rata ? `${yearData.suhu_rata}°C` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-700">
                            {yearData?.kelembapan ? `${yearData.kelembapan}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-700">
                            {yearData?.kecepatan_angin ? `${yearData.kecepatan_angin} km/h` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">Periode data: {yearlyWeather.periode} • Kabupaten: {yearlyWeather.kabupaten}</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
