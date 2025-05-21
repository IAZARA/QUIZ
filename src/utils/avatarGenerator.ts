// Utilidad para generar avatares y nombres para los participantes del torneo

// Colores disponibles para los avatares
const colors = [
  'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado', 'Rosa', 
  'Turquesa', 'Dorado', 'Plateado', 'Negro', 'Blanco', 'Marrón', 
  'Gris', 'Celeste', 'Violeta', 'Coral', 'Cian', 'Magenta', 'Lima'
];

// Animales disponibles para los avatares
const animals = [
  'Tigre', 'León', 'Elefante', 'Jirafa', 'Delfín', 'Águila', 'Lobo',
  'Zorro', 'Oso', 'Búho', 'Panda', 'Koala', 'Cebra', 'Pingüino', 'Tortuga',
  'Camaleón', 'Jaguar', 'Rinoceronte', 'Mapache', 'Canguro', 'Loro', 'Alce',
  'Camello', 'Cocodrilo', 'Puma', 'Gorila', 'Hipopótamo', 'Foca', 'Nutria', 'Tucán'
];

// Genera un color aleatorio único de la lista
const getRandomColor = (usedColors: string[] = []): string => {
  const availableColors = colors.filter(color => !usedColors.includes(color));
  if (availableColors.length === 0) return colors[Math.floor(Math.random() * colors.length)];
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};

// Genera un animal aleatorio único de la lista
const getRandomAnimal = (usedAnimals: string[] = []): string => {
  const availableAnimals = animals.filter(animal => !usedAnimals.includes(animal));
  if (availableAnimals.length === 0) return animals[Math.floor(Math.random() * animals.length)];
  return availableAnimals[Math.floor(Math.random() * availableAnimals.length)];
};

// Genera un avatar con nombre único (combinación de animal y color)
export const generateUniqueAvatar = (existingAvatars: string[] = []): { name: string, avatar: string } => {
  const usedAnimals: string[] = [];
  const usedColors: string[] = [];
  
  // Extraer animales y colores ya utilizados
  existingAvatars.forEach(avatar => {
    const parts = avatar.split(' ');
    if (parts.length >= 2) {
      usedAnimals.push(parts[0]);
      usedColors.push(parts[1]);
    }
  });
  
  const animal = getRandomAnimal(usedAnimals);
  const color = getRandomColor(usedColors);
  const name = `${animal} ${color}`;
  
  // Generar un emoji o código de avatar basado en el animal
  let avatar = '🐾'; // Emoji por defecto
  
  // Asignar emojis específicos según el animal (podemos ampliar esta lista)
  const animalEmojis: Record<string, string> = {
    'Tigre': '🐯', 'León': '🦁', 'Elefante': '🐘', 'Jirafa': '🦒',
    'Delfín': '🐬', 'Águila': '🦅', 'Lobo': '🐺', 'Zorro': '🦊',
    'Oso': '🐻', 'Búho': '🦉', 'Panda': '🐼', 'Koala': '🐨',
    'Cebra': '🦓', 'Pingüino': '🐧', 'Tortuga': '🐢', 'Camaleón': '🦎',
    'Loro': '🦜', 'Cocodrilo': '🐊', 'Gorila': '🦍', 'Hipopótamo': '🦛',
    'Foca': '🦭', 'Nutria': '🦦', 'Tucán': '🦤'
  };
  
  if (animalEmojis[animal]) {
    avatar = animalEmojis[animal];
  }
  
  return { name, avatar };
};

// Genera un conjunto de avatares únicos para un torneo
export const generateTournamentAvatars = (count: number): Array<{ name: string, avatar: string }> => {
  const avatars: Array<{ name: string, avatar: string }> = [];
  const existingNames: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const newAvatar = generateUniqueAvatar(existingNames);
    avatars.push(newAvatar);
    existingNames.push(newAvatar.name);
  }
  
  return avatars;
};
