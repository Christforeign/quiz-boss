import type { QuizQuestion } from "../hardQuestions";
import { dedupeQuestions, pickDistractors } from "./helpers";

export const MUSIC_HITS: Array<[string, string, string, string, number]> = [
  // [Titre, Artiste, Genre, Année, Difficulté]
  ["New York City", "Tabou Combo", "Compas Direct", "1974", 2],
  ["Bang Bang", "Carimi", "Compas Nouvelle Génération", "2002", 1],
  ["Ayiti Se", "Mikaben (Michael Benjamin)", "Compas & R&B", "2013", 1],
  ["5 Ewal", "Zenglen", "Compas Direct", "2001", 2],
  ["I Miss You", "Nu-Look (Arly Larivière)", "Compas Love", "2013", 2],
  ["Chwa Pa M", "Alan Cavé", "Compas Love", "2004", 2],
  ["Kite M Viv", "Rutshelle Guillaume", "Compas & Soul", "2017", 2],
  ["Yon Ti Chans", "K-Dilak & Bedjine", "Compas Romantique", "2021", 1],
  ["Ou Pa Pou Mwen", "Enposib (Medhy Custos)", "Compas Love", "2018", 2],
  ["Gouyad Papa", "Sweet Micky (Michel Martelly)", "Compas Gouyad", "1994", 2],
  ["Kè M Ap Fann", "Harmonik (Nickenson Prud'homme)", "Compas Love", "2010", 2],
  ["Avèk Ou", "Djakout #1", "Compas Direct", "2008", 2],
  ["San Konsyans", "T-Vice (Roberto Martino)", "Compas Direct", "2006", 2],
  ["Adrienne", "Orchestre Septentrional", "Compas Ansyen", "1965", 3],
  ["Limyè Lanmou", "Orchestre Tropicana d'Haïti", "Compas Traditionnel", "1978", 3],
  ["Kèm Pa Sote", "Boukman Eksperyans", "Mizik Rasin", "1990", 2],
  ["Fè M Wè", "RAM (Richard Morse)", "Mizik Rasin", "1993", 3],
  ["Dènye Lèt", "Baky", "Rap Kreyòl", "2022", 1],
  ["Gaye Bouboun", "Fantome (Barikad Crew)", "Rap Kreyòl", "2008", 2],
  ["Nou Pa Pè", "Barikad Crew", "Rap Kreyòl", "2007", 1],
  ["Nou Gen Pouvwa", "Mystik 703", "Rap Kreyòl", "2009", 2],
  ["Depi M Bwè", "Troubleboy Hitmaker", "Rap Kreyòl", "2017", 2],
  ["Kite M Kriye", "Wendy (King)", "Rap Kreyòl", "2016", 1],
  ["Thriller", "Michael Jackson", "Pop & Funk", "1982", 1],
  ["Billie Jean", "Michael Jackson", "Pop & Funk", "1982", 1],
  ["No Woman, No Cry", "Bob Marley & The Wailers", "Reggae", "1974", 1],
  ["One Love", "Bob Marley", "Reggae", "1977", 1],
  ["Redemption Song", "Bob Marley", "Reggae Acoustique", "1980", 1],
  ["Shape of You", "Ed Sheeran", "Pop", "2017", 1],
  ["Blinding Lights", "The Weeknd", "Synthwave Pop", "2019", 1],
  ["Uptown Funk", "Mark Ronson & Bruno Mars", "Funk Pop", "2014", 1],
  ["Bad Guy", "Billie Eilish", "Electropop", "2019", 1],
  ["Djadja", "Aya Nakamura", "Afropop & R&B", "2018", 1],
  ["Bella", "Gims", "Pop Urbaine", "2013", 1],
  ["Sapés comme jamais", "Gims & Niska", "Afro Trap", "2015", 1],
  ["Papaoutai", "Stromae", "Électro Pop", "2013", 1],
  ["Alors on danse", "Stromae", "Électro", "2009", 1],
  ["Last Last", "Burna Boy", "Afrobeats", "2022", 1],
  ["Essence", "Wizkid & Tems", "Afrobeats", "2020", 2],
  ["Fall", "Davido", "Afrobeats", "2017", 2],
  ["Calm Down", "Rema (feat. Selena Gomez)", "Afrorave / Afrobeats", "2022", 1],
  ["Water", "Tyla", "Amapiano Pop", "2023", 1],
  ["Jerusalema", "Master KG & Nomcebo", "Afro House / Amapiano", "2019", 1],
  ["Despacito", "Luis Fonsi & Daddy Yankee", "Reggaeton Pop", "2017", 1],
  ["Dakiti", "Bad Bunny & Jhayco", "Reggaeton", "2020", 2],
  ["Mi Gente", "J Balvin & Willy William", "Reggaeton", "2017", 1],
  ["Waka Waka", "Shakira", "Pop World", "2010", 1],
  ["Hips Don't Lie", "Shakira & Wyclef Jean", "Latin Pop", "2006", 1],
  ["Diamonds", "Rihanna", "Pop & R&B", "2012", 1],
  ["Umbrella", "Rihanna & Jay-Z", "R&B Pop", "2007", 1],
  ["God's Plan", "Drake", "Hip-Hop & Trap", "2018", 1],
  ["Hotline Bling", "Drake", "R&B", "2015", 1],
  ["Old Town Road", "Lil Nas X & Billy Ray Cyrus", "Country Trap", "2019", 1],
  ["Flowers", "Miley Cyrus", "Disco Pop", "2023", 1],
  ["As It Was", "Harry Styles", "Synthpop", "2022", 1],
  ["Levitating", "Dua Lipa", "Nu-Disco Pop", "2020", 1],
  ["Rolling in the Deep", "Adele", "Soul Pop", "2010", 1],
  ["Someone Like You", "Adele", "Ballade Soul", "2011", 1],
  ["Crazy in Love", "Beyoncé & Jay-Z", "R&B", "2003", 1],
  ["Single Ladies", "Beyoncé", "Pop & R&B", "2008", 1],
  ["Gangnam Style", "PSY", "K-Pop", "2012", 1],
  ["Dynamite", "BTS", "K-Pop Disco", "2020", 1],
  ["Casanova", "Soolking", "Raï Urbain Pop", "2023", 2],
  ["Gamberge", "Tiakola", "Melodic Drill", "2022", 2],
  ["Bande Organisée", "13 Organisé (Jul, SCH, Kofs...)", "Rap Français", "2020", 1],
  ["Khapta", "Heuss l'Enfoiré & Sofiane", "Rap / Club", "2019", 2],
  ["Petrouchka", "Soso Maness & PLK", "Rap Électro", "2021", 2],
  ["La Fama", "Rosalía & The Weeknd", "Bachata Alternative", "2021", 2],
  ["TQG", "Karol G & Shakira", "Reggaeton", "2023", 1],
  ["Monalisa", "Lojay & Sarz", "Afropop", "2021", 2],
  ["Buga", "Kizz Daniel & Tekno", "Afrobeats", "2022", 1],
  ["Soweto", "Victony & Tempoe", "Afropop", "2022", 2],
  ["Love Nwantiti", "CKay", "Acoustic Afrobeats", "2019", 1],
  ["Touch It", "KiDi", "Afrobeats", "2021", 2],
  ["Ku Lo Sa", "Oxlade", "Afropop", "2022", 1],
  ["Mifé", "Steves J. Bryan", "Rap Kreyòl & Drill", "2021", 2],
  ["Map Marye", "Harmonik", "Compas Romantique", "2016", 2],
  ["Baby I Miss You", "Carimi", "Compas Love", "2005", 1],
  ["Chay", "Djakout Mizik", "Compas Direct", "1998", 2],
  ["Mabouya", "Tabou Combo", "Compas Funk", "1989", 2],
  ["Femme Trop Belle", "Coupe Cloué", "Compas Manba", "1983", 3],
  ["Tu me touches", "Zenglen & Richie", "Compas Love", "2005", 2],
  ["Jeu d'Enfant", "Klass", "Compas Direct", "2013", 2],
  ["Ranje Chita w", "Klass (Richie)", "Compas Direct", "2016", 2],
  ["Mizik Sa", "Disip (Gazzman Couleur)", "Compas Direct", "2013", 2],
  ["Heartless", "The Weeknd", "R&B Trap", "2019", 2],
  ["Starboy", "The Weeknd & Daft Punk", "Electro R&B", "2016", 1],
  ["Get Lucky", "Daft Punk & Pharrell Williams", "Disco Funk", "2013", 1],
  ["One More Time", "Daft Punk", "House", "2000", 1],
  ["Lose Yourself", "Eminem", "Hip-Hop", "2002", 1],
  ["In Da Club", "50 Cent", "Hip-Hop", "2003", 1],
  ["See You Again", "Wiz Khalifa & Charlie Puth", "Hip-Hop Pop", "2015", 1],
  ["Locked Out of Heaven", "Bruno Mars", "Pop Funk", "2012", 1],
  ["Wake Me Up", "Avicii & Aloe Blacc", "EDM Country", "2013", 1],
  ["Titanium", "David Guetta & Sia", "EDM Pop", "2011", 1],
];

export function getMusiqueQuestions(): QuizQuestion[] {
  const results: QuizQuestion[] = [];
  const artists = Array.from(new Set(MUSIC_HITS.map((m) => m[1])));
  const titles = MUSIC_HITS.map((m) => m[0]);
  const years = Array.from(new Set(MUSIC_HITS.map((m) => m[3])));
  const genres = Array.from(new Set(MUSIC_HITS.map((m) => m[2])));

  MUSIC_HITS.forEach(([title, artist, genre, year, diff], i) => {
    // 1. Qui interprète ce titre ?
    results.push({
      id: `mus-art-${i}`,
      category: "musique",
      question: `Quel artiste ou groupe interprète le titre célèbre « ${title} » ?`,
      options: pickDistractors(artist, artists, i * 13),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });

    // 2. Quel titre de cet artiste ?
    results.push({
      id: `mus-title-${i}`,
      category: "musique",
      question: `Lequel de ces morceaux est un tube de ${artist} (${year}) ?`,
      options: pickDistractors(title, titles, i * 19),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });

    // 3. En quelle année ?
    results.push({
      id: `mus-yr-${i}`,
      category: "musique",
      question: `En quelle année le morceau « ${title} » (${artist}) a-t-il marqué l'histoire musicale ?`,
      options: pickDistractors(year, years, i * 7),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });

    // 4. Quel genre musical ?
    results.push({
      id: `mus-gen-${i}`,
      category: "musique",
      question: `À quel univers ou style musical appartient le morceau « ${title} » de ${artist} ?`,
      options: pickDistractors(genre, genres, i * 29),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
  });

  return dedupeQuestions(results);
}
