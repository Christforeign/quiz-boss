import type { QuizQuestion } from "../hardQuestions";
import { dedupeQuestions, pickDistractors } from "./helpers";

export const CINEMA_WORKS: Array<[string, string, string, string, number]> = [
  // [Titre, Réalisateur/Créateur, Acteur/Personnage phare, Année, Difficulté]
  ["Titanic", "James Cameron", "Leonardo DiCaprio (Jack Dawson)", "1997", 1],
  ["Avatar", "James Cameron", "Sam Worthington (Jake Sully)", "2009", 1],
  ["Inception", "Christopher Nolan", "Leonardo DiCaprio (Dom Cobb)", "2010", 1],
  ["Oppenheimer", "Christopher Nolan", "Cillian Murphy (J. Robert Oppenheimer)", "2023", 1],
  ["Interstellar", "Christopher Nolan", "Matthew McConaughey (Cooper)", "2014", 1],
  ["The Dark Knight", "Christopher Nolan", "Christian Bale & Heath Ledger (Le Joker)", "2008", 1],
  ["Pulp Fiction", "Quentin Tarantino", "John Travolta & Samuel L. Jackson", "1994", 1],
  ["Django Unchained", "Quentin Tarantino", "Jamie Foxx & Christoph Waltz", "2012", 1],
  ["Kill Bill", "Quentin Tarantino", "Uma Thurman (La Mariée)", "2003", 1],
  ["Inglourious Basterds", "Quentin Tarantino", "Brad Pitt (Lt. Aldo Raine)", "2009", 1],
  ["Le Parrain", "Francis Ford Coppola", "Marlon Brando (Vito Corleone)", "1972", 1],
  ["Apocalypse Now", "Francis Ford Coppola", "Martin Sheen (Capitaine Willard)", "1979", 2],
  ["Gladiator", "Ridley Scott", "Russell Crowe (Maximus)", "2000", 1],
  ["Blade Runner", "Ridley Scott", "Harrison Ford (Rick Deckard)", "1982", 2],
  ["Matrix", "Les Wachowski", "Keanu Reeves (Neo)", "1999", 1],
  ["John Wick", "Chad Stahelski", "Keanu Reeves (John Wick)", "2014", 1],
  ["Le Seigneur des Anneaux", "Peter Jackson", "Elijah Wood (Frodon Sacquet)", "2001", 1],
  ["King Kong", "Peter Jackson", "Naomi Watts (Ann Darrow)", "2005", 2],
  ["Forrest Gump", "Robert Zemeckis", "Tom Hanks (Forrest Gump)", "1994", 1],
  ["Retour vers le futur", "Robert Zemeckis", "Michael J. Fox (Marty McFly)", "1985", 1],
  ["Seul au monde", "Robert Zemeckis", "Tom Hanks (Chuck Noland)", "2000", 1],
  ["Jurassic Park", "Steven Spielberg", "Sam Neill (Dr Alan Grant)", "1993", 1],
  ["La Liste de Schindler", "Steven Spielberg", "Liam Neeson (Oskar Schindler)", "1993", 2],
  ["Il faut sauver le soldat Ryan", "Steven Spielberg", "Tom Hanks (Capitaine Miller)", "1998", 1],
  ["Les Dents de la mer", "Steven Spielberg", "Roy Scheider (Martin Brody)", "1975", 1],
  ["Fight Club", "David Fincher", "Brad Pitt & Edward Norton", "1999", 1],
  ["Seven", "David Fincher", "Morgan Freeman & Brad Pitt", "1995", 1],
  ["The Social Network", "David Fincher", "Jesse Eisenberg (Mark Zuckerberg)", "2010", 1],
  ["Le Silence des agneaux", "Jonathan Demme", "Anthony Hopkins (Hannibal Lecter)", "1991", 2],
  ["Shining", "Stanley Kubrick", "Jack Nicholson (Jack Torrance)", "1980", 2],
  ["2001 : L'Odyssée de l'espace", "Stanley Kubrick", "Keir Dullea (Dave Bowman)", "1968", 3],
  ["Orange mécanique", "Stanley Kubrick", "Malcolm McDowell (Alex DeLarge)", "1971", 2],
  ["Scarface", "Brian De Palma", "Al Pacino (Tony Montana)", "1983", 1],
  ["Taxi Driver", "Martin Scorsese", "Robert De Niro (Travis Bickle)", "1976", 2],
  ["Les Affranchis", "Martin Scorsese", "Ray Liotta & Robert De Niro", "1990", 2],
  ["Le Loup de Wall Street", "Martin Scorsese", "Leonardo DiCaprio (Jordan Belfort)", "2013", 1],
  ["Shutter Island", "Martin Scorsese", "Leonardo DiCaprio (Teddy Daniels)", "2010", 1],
  ["Parasite", "Bong Joon-ho", "Song Kang-ho (Kim Ki-taek)", "2019", 1],
  ["Black Panther", "Ryan Coogler", "Chadwick Boseman (T'Challa)", "2018", 1],
  ["Creed", "Ryan Coogler", "Michael B. Jordan (Adonis Creed)", "2015", 1],
  ["Avengers: Endgame", "Anthony & Joe Russo", "Robert Downey Jr. (Iron Man)", "2019", 1],
  ["Iron Man", "Jon Favreau", "Robert Downey Jr. (Tony Stark)", "2008", 1],
  ["Barbie", "Greta Gerwig", "Margot Robbie (Barbie)", "2023", 1],
  ["La La Land", "Damien Chazelle", "Ryan Gosling & Emma Stone", "2016", 1],
  ["Whiplash", "Damien Chazelle", "Miles Teller & J.K. Simmons", "2014", 2],
  [
    "Le Fabuleux Destin d'Amélie Poulain",
    "Jean-Pierre Jeunet",
    "Audrey Tautou (Amélie)",
    "2001",
    1,
  ],
  [
    "Intouchables",
    "Olivier Nakache & Éric Toledano",
    "Omar Sy (Driss) & François Cluzet",
    "2011",
    1,
  ],
  ["La Haine", "Mathieu Kassovitz", "Vincent Cassel (Vinz)", "1995", 2],
  ["Freda", "Gessica Généus", "Néhémie Bastien (Freda)", "2021", 2],
  ["Kafou", "Bruno Mourral", "Jasmuel Andri & Manfred Marcelin", "2017", 2],
  ["L'Homme sur les quais", "Raoul Peck", "Jennifer Zubar", "1993", 3],
  ["Lumumba", "Raoul Peck", "Eriq Ebouaney (Patrice Lumumba)", "2000", 2],
  ["I Am Not Your Negro", "Raoul Peck", "Samuel L. Jackson (Voix de James Baldwin)", "2016", 3],
  ["Squid Game", "Hwang Dong-hyuk", "Lee Jung-jae (Seong Gi-hun / 456)", "2021", 1],
  ["Breaking Bad", "Vince Gilligan", "Bryan Cranston (Walter White / Heisenberg)", "2008", 1],
  ["Better Call Saul", "Vince Gilligan & Peter Gould", "Bob Odenkirk (Saul Goodman)", "2015", 2],
  ["Game of Thrones", "David Benioff & D.B. Weiss", "Kit Harington (Jon Snow)", "2011", 1],
  [
    "House of the Dragon",
    "Ryan Condal & George R.R. Martin",
    "Matt Smith (Daemon Targaryen)",
    "2022",
    1,
  ],
  ["Stranger Things", "Les Frères Duffer", "Millie Bobby Brown (Eleven)", "2016", 1],
  ["Peaky Blinders", "Steven Knight", "Cillian Murphy (Thomas Shelby)", "2013", 1],
  ["La Casa de Papel", "Álex Pina", "Álvaro Morte (Le Professeur)", "2017", 1],
  ["Lupin", "George Kay & François Uzan", "Omar Sy (Assane Diop)", "2021", 1],
  ["Narcos", "Chris Brancato & Carlo Bernard", "Wagner Moura (Pablo Escobar)", "2015", 1],
  ["Prison Break", "Paul Scheuring", "Wentworth Miller (Michael Scofield)", "2005", 1],
  ["The Walking Dead", "Frank Darabont", "Andrew Lincoln (Rick Grimes)", "2010", 1],
  ["Vikings", "Michael Hirst", "Travis Fimmel (Ragnar Lothbrok)", "2013", 1],
  ["The Boys", "Eric Kripke", "Antony Starr (Homelander)", "2019", 2],
  ["Euphoria", "Sam Levinson", "Zendaya (Rue Bennett)", "2019", 2],
  [
    "The Last of Us",
    "Craig Mazin & Neil Druckmann",
    "Pedro Pascal (Joel) & Bella Ramsey",
    "2023",
    1,
  ],
  ["Succession", "Jesse Armstrong", "Brian Cox (Logan Roy)", "2018", 2],
  ["Chernobyl", "Craig Mazin", "Jared Harris (Valery Legasov)", "2019", 2],
  ["Friends", "David Crane & Marta Kauffman", "Jennifer Aniston (Rachel Green)", "1994", 1],
  ["The Office (US)", "Greg Daniels", "Steve Carell (Michael Scott)", "2005", 1],
  ["Black Mirror", "Charlie Brooker", "Série d'anthologie dystopique", "2011", 2],
  ["Dark", "Baran bo Odar & Jantje Friese", "Louis Hofmann (Jonas Kahnwald)", "2017", 2],
  [
    "Mercredi (Wednesday)",
    "Alfred Gough & Miles Millar",
    "Jenna Ortega (Wednesday Addams)",
    "2022",
    1,
  ],
  ["Le Jeu de la dame", "Scott Frank & Allan Scott", "Anya Taylor-Joy (Beth Harmon)", "2020", 1],
  ["Money Heist: Berlin", "Álex Pina & Esther Martínez Lobato", "Pedro Alonso (Berlin)", "2023", 2],
  ["Gomorra", "Roberto Saviano & Stefano Sollima", "Marco D'Amore (Ciro Di Marzio)", "2014", 3],
  ["Ozark", "Bill Dubuque & Mark Williams", "Jason Bateman (Marty Byrde)", "2017", 2],
  ["Sherlock", "Steven Moffat & Mark Gatiss", "Benedict Cumberbatch (Sherlock Holmes)", "2010", 1],
  ["Dexter", "James Manos Jr.", "Michael C. Hall (Dexter Morgan)", "2006", 1],
  ["Mad Men", "Matthew Weiner", "Jon Hamm (Don Draper)", "2007", 3],
  ["The Sopranos", "David Chase", "James Gandolfini (Tony Soprano)", "1999", 2],
  ["The Wire", "David Simon", "Dominic West & Idris Elba", "2002", 3],
  ["True Detective", "Nic Pizzolatto", "Matthew McConaughey & Woody Harrelson", "2014", 2],
  ["Fargo", "Noah Hawley", "Billy Bob Thornton & Martin Freeman", "2014", 2],
  ["Mindhunter", "Joe Penhall & David Fincher", "Jonathan Groff (Holden Ford)", "2017", 2],
  ["Dune", "Denis Villeneuve", "Timothée Chalamet (Paul Atreides)", "2021", 1],
  ["Blade Runner 2049", "Denis Villeneuve", "Ryan Gosling (Officier K)", "2017", 2],
  ["Premier Contact", "Denis Villeneuve", "Amy Adams (Louise Banks)", "2016", 2],
  ["Get Out", "Jordan Peele", "Daniel Kaluuya (Chris Washington)", "2017", 1],
  ["Us", "Jordan Peele", "Lupita Nyong'o (Adelaide Wilson)", "2019", 2],
  ["Nope", "Jordan Peele", "Daniel Kaluuya & Keke Palmer", "2022", 2],
  ["Coco", "Lee Unkrich & Adrian Molina", "Film d'animation Pixar (Jour des Morts)", "2017", 1],
];

export function getCinemaQuestions(): QuizQuestion[] {
  const results: QuizQuestion[] = [];
  const directors = Array.from(new Set(CINEMA_WORKS.map((c) => c[1])));
  const actors = CINEMA_WORKS.map((c) => c[2]);
  const works = CINEMA_WORKS.map((c) => c[0]);
  const years = Array.from(new Set(CINEMA_WORKS.map((c) => c[3])));

  CINEMA_WORKS.forEach(([work, director, star, year, diff], i) => {
    // 1. Réalisateur
    results.push({
      id: `cin-dir-${i}`,
      category: "cinema",
      question: `Qui a réalisé ou créé l'œuvre culte « ${work} » (${year}) ?`,
      options: pickDistractors(director, directors, i * 11),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });

    // 2. Acteur / Personnage
    results.push({
      id: `cin-star-${i}`,
      category: "cinema",
      question: `Quel acteur ou personnage principal est indissociable de « ${work} » ?`,
      options: pickDistractors(star, actors, i * 17),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });

    // 3. Titre depuis l'acteur et réalisateur
    results.push({
      id: `cin-work-${i}`,
      category: "cinema",
      question: `Dans quelle production retrouve-t-on ${star} (réalisée/créée par ${director}) ?`,
      options: pickDistractors(work, works, i * 23),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });

    // 4. Année
    results.push({
      id: `cin-yr-${i}`,
      category: "cinema",
      question: `En quelle année l'œuvre cinématographique ou télévisuelle « ${work} » est-elle sortie ?`,
      options: pickDistractors(year, years, i * 31),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });
  });

  return dedupeQuestions(results);
}
