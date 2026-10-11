export const districts = [
  "南山",
  "福田",
  "罗湖",
  "盐田",
  "宝安",
  "龙岗",
  "龙华",
  "光明",
  "坪山",
  "大鹏新区",
] as const;
export const categories = [
  "historic building",
  "modern building",
  "amusement park",
  "art gallery",
  "shopping centre",
  "park",
  "beach",
  "mountain",
  "shopping area",
  "historic place",
];
export type Place = {
  id: string;
  nameZh: string;
  nameEn: string;
  district: string;
  districts: string[];
  coordinates: null | [number, number];
  tags: string[];
  textbookCategory: string | null;
  image: string | null;
  panorama: string | null;
  video: string | null;
  source: string;
  license: string;
  verificationStatus: string;
};
const rows: [string, string, string, string, string[], string | null][] = [
  [
    "window",
    "世界之窗",
    "Window of the World",
    "南山",
    ["amusement park"],
    "amusement park",
  ],
  [
    "valley",
    "欢乐谷",
    "Happy Valley",
    "南山",
    ["amusement park"],
    "amusement park",
  ],
  [
    "nantou",
    "南头古城",
    "Nantou Ancient City",
    "南山",
    ["historic place"],
    null,
  ],
  [
    "pingan",
    "平安金融中心",
    "Ping An Finance Centre",
    "福田",
    ["modern building"],
    "modern building",
  ],
  [
    "lianhua",
    "莲花山公园",
    "Lianhuashan Park",
    "福田",
    ["park", "mountain"],
    null,
  ],
  ["huaqiang", "华强北", "Huaqiangbei", "福田", ["shopping area"], null],
  [
    "coco",
    "COCO Park（福田）",
    "COCO Park (Futian)",
    "福田",
    ["shopping centre"],
    "shopping centre",
  ],
  [
    "gankeng",
    "甘坑古镇",
    "Gankeng Ancient Town",
    "龙岗",
    ["historic place"],
    null,
  ],
  [
    "dapeng",
    "大鹏所城",
    "Dapeng Fortress",
    "大鹏新区",
    ["historic place"],
    null,
  ],
  ["dameisha", "大梅沙", "Dameisha Beach", "盐田", ["beach"], null],
  [
    "museum",
    "深圳美术馆（新馆）",
    "Shenzhen Art Museum (New Venue)",
    "龙华",
    ["art gallery"],
    "art gallery",
  ],
  ["dongmen", "东门", "Dongmen", "罗湖", ["shopping area"], null],
  [
    "haibin",
    "宝安滨海文化公园",
    "Bao’an Coastal Cultural Park",
    "宝安",
    ["park"],
    null,
  ],
  ["hongqiao", "虹桥公园", "Hongqiao Park", "光明", ["park"], null],
  [
    "pingshan",
    "坪山美术馆",
    "Pingshan Art Museum",
    "坪山",
    ["art gallery"],
    "art gallery",
  ],
];
export const places: Place[] = rows.map(
  ([id, nameZh, nameEn, district, tags, textbookCategory]) => ({
    id,
    nameZh,
    nameEn,
    district,
    districts: [district],
    tags,
    textbookCategory,
    coordinates: null,
    image: null,
    panorama: null,
    video: null,
    source: "地点候选；行政区及馆址请据官方地点资料复核后替换。未采用经纬度。",
    license: "媒体授权待补",
    verificationStatus: "pending",
  }),
);
export const another: Place = {
  id: "another",
  nameZh: "另一个地点",
  nameEn: "Another Place!",
  district: "未定位",
  districts: [],
  coordinates: null,
  tags: [],
  textbookCategory: null,
  image: null,
  panorama: null,
  video: null,
  source: "学生口头补充，教师无须输入；不标注准确坐标",
  license: "无媒体",
  verificationStatus: "oral",
};
export const allPlaces = [...places, another];
export const questions = [
  {
    page: 62,
    file: "02",
    question: "What interesting places can you find in a city?",
    region: { left: "52%", top: "4%", width: "42%", height: "9%" },
  },
  {
    page: 66,
    file: "06",
    question: "What historic or modern buildings are there in your city?",
    region: { left: "14%", top: "75%", width: "75%", height: "9%" },
  },
  {
    page: 68,
    file: "08",
    question:
      "Is there a river or lake in or near your area? How important is it?",
    region: { left: "14%", top: "77%", width: "75%", height: "8%" },
  },
  {
    page: 72,
    file: "12",
    question: "What was your city like in the past? What is it like now?",
    region: { left: "12%", top: "48%", width: "76%", height: "8%" },
  },
];
export const titles = [
  "Guess the City",
  "Welcoming the World",
  "Find the Big Questions",
  "Explore the Textbook",
  "Our Shenzhen Question",
  "Shenzhen Discovery Map",
  "Sort and Describe",
  "Vocabulary & Practice",
  "Meet a Real Visitor",
  "Choose Places",
  "Group Recommendation Card",
  "Our City, Our Discoveries",
];
export const timings = [
  "4 min",
  "5 min",
  "4 min · P03–05",
  "共用时间",
  "共用时间",
  "7 min",
  "4 min",
  "5 min",
  "3 min",
  "7 min · P10–11",
  "共用时间",
  "1 min",
];
export const cities = [
  {
    name: "Beijing",
    flag: "🇨🇳",
    clues: [
      "北京烤鸭 · Roast duck",
      "长城 · The Great Wall",
      "故宫 · The Forbidden City",
    ],
  },
  {
    name: "London",
    flag: "🇬🇧",
    clues: ["Fish and chips", "The River Thames", "Big Ben"],
  },
  {
    name: "New York",
    flag: "🇺🇸",
    clues: ["A bagel", "Central Park", "The Statue of Liberty"],
  },
  {
    name: "Shenzhen",
    flag: "🇨🇳",
    clues: [
      "世界之窗埃菲尔铁塔复制建筑实拍（待补）",
      "世界之窗其他复制景观实拍（待补）",
      "深圳城市风景实拍（待补）",
      "平安金融中心实拍（待补）",
    ],
  },
];
