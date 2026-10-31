/*
  Har gaane ki audio file "songs/" folder me id ke naam se rakho, e.g. songs/kesariya.mp3
  Naya gaana: neeche ek line aur jod do -> [ "file-id", "Title", "Artist (Film)" ]
*/
const COVERS = [
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500"
];
const SONGS = [
  ["tum-hi-ho", "Tum Hi Ho", "Arijit Singh (Aashiqui 2)"],
  ["rang-jo-lagyo", "Rang Jo Lagyo", "Shreya Ghosal, Atif Aslam (Ramaiya Vastavaiya)"],
  ["kesariya", "Kesariya", "Arijit Singh (Brahmastra)"],
  ["saiyara", "Saiyaara", "Tanishk Bagchi (Saiyaara)"],
  ["NewHumnava", "Humnava Mere", "Jubin Nautiyal (Song)"],
  ["dhun", "Dhun", "Mithoon, Arijit Singh (Saiyaara)"],
  ["mat-azma", "Mat Azma Re", "KK (Murder 3)"],
  ["haledil", "Hale dil", "Harshit Saxena (Murder 2)"],
  ["bewafa", "Bewafa", "Imran Khan (Song)"],
  ["piyaAye", "Piya Aye Na", "Tulsi Kumar, KK (Aashiqui 2)"],
  ["nasheSi", "Nashe Si Chad Gyi", "Vishal Shekhar (Befikre)"],
  ["kalank", "Kalank-Tittle Track", "Arijit Singh (Kalank)"],
  ["mahi", "Mahi", "Sharib Toshi, Sayeed Quadri (Raaz)"],
  ["isThis", "Somewhere Only We Know", "Keane (Song)"],
  ["sun-rha", "Sunn Raha Hai", "Ankit Tiwari (Aashiqui 2)"],
  ["chalrey", "Chalrey Chalrey Waal", "Sufi Mafiya (Song)"],
  ["milne-hai-mujhse", "Milne Hai Mujhse Ayi", "Arijit Singh (Aashiqui 2)"],
  ["balenci", "Balenci", "Shubh (Forest)"],
  ["elevated", "Elevated", "Shubh (Treaty)"],
  ["baller", "Baller", "Shubh (MindWine)"],
  ["mover", "Moves", "Shubh (Circle Game)"],
  ["cheque", "Cheques", "Shubh (Circle Game)"]
  

].map(([id, title, artist], i) => ({ id, title, artist, cover: COVERS[i % COVERS.length], file: "songs/" + id + ".mp3" }));