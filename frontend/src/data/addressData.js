// Country list with country code and states/regions
const ADDRESS_DATA = {
  India: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
  ],
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming',
  ],
  'United Kingdom': [
    'England', 'Scotland', 'Wales', 'Northern Ireland',
  ],
  Canada: [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
    'Newfoundland and Labrador', 'Nova Scotia', 'Ontario',
    'Prince Edward Island', 'Quebec', 'Saskatchewan',
    'Northwest Territories', 'Nunavut', 'Yukon',
  ],
  Australia: [
    'New South Wales', 'Queensland', 'South Australia', 'Tasmania',
    'Victoria', 'Western Australia', 'Australian Capital Territory',
    'Northern Territory',
  ],
  Germany: [
    'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen',
    'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern',
    'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland',
    'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia',
  ],
  France: [
    'Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes',
    'Occitanie', 'Nouvelle-Aquitaine', 'Hauts-de-France', 'Grand Est',
    'Brittany', 'Normandy', 'Pays de la Loire', 'Centre-Val de Loire',
    'Bourgogne-Franche-Comté', 'Corsica',
  ],
  Japan: [
    'Hokkaido', 'Tohoku', 'Kanto', 'Chubu', 'Kansai', 'Chugoku',
    'Shikoku', 'Kyushu',
  ],
  'South Korea': [
    'Seoul', 'Busan', 'Daegu', 'Incheon', 'Gwangju', 'Daejeon',
    'Ulsan', 'Sejong', 'Gyeonggi', 'Gangwon', 'Chungbuk', 'Chungnam',
    'Jeonbuk', 'Jeonnam', 'Gyeongbuk', 'Gyeongnam', 'Jeju',
  ],
  Singapore: ['Singapore'],
  'United Arab Emirates': [
    'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al-Quwain',
    'Ras Al Khaimah', 'Fujairah',
  ],
  'Saudi Arabia': [
    'Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Asir',
    'Tabuk', 'Hail', 'Northern Borders', 'Jazan', 'Najran',
    'Al Bahah', 'Al Jawf', 'Qassim',
  ],
  Brazil: [
    'São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná',
    'Rio Grande do Sul', 'Pernambuco', 'Ceará', 'Pará', 'Santa Catarina',
    'Maranhão', 'Goiás', 'Amazonas', 'Espírito Santo', 'Paraíba',
    'Mato Grosso', 'Rio Grande do Norte', 'Alagoas', 'Piauí',
    'Distrito Federal', 'Mato Grosso do Sul', 'Sergipe', 'Rondônia',
    'Tocantins', 'Acre', 'Amapá', 'Roraima',
  ],
  China: [
    'Beijing', 'Shanghai', 'Guangdong', 'Zhejiang', 'Jiangsu',
    'Shandong', 'Henan', 'Sichuan', 'Hubei', 'Hunan', 'Fujian',
    'Anhui', 'Hebei', 'Liaoning', 'Shaanxi', 'Chongqing', 'Tianjin',
    'Jiangxi', 'Guangxi', 'Yunnan', 'Guizhou', 'Shanxi', 'Inner Mongolia',
    'Heilongjiang', 'Jilin', 'Xinjiang', 'Gansu', 'Hainan', 'Ningxia',
    'Tibet', 'Qinghai',
  ],
};

export const COUNTRIES = Object.keys(ADDRESS_DATA).sort();
export const getStates = (country) => ADDRESS_DATA[country] || [];
export default ADDRESS_DATA;
