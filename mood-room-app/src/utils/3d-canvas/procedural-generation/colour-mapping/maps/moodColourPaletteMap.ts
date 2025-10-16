import { MoodType, roomColourPalette } from "@/types/types";

//NOTE/ README:
// explaining all colours via comments is time consuming; to avoid testing out every colour please install a color highlighter viewer
// extension to see all the colours inside the editor as a preview (if using vs code as an editor);
//  makes seeing the colours and testing very easy.


export const moodColourPaletteEmotionMap: Record<MoodType, roomColourPalette[]> = {
    happy: [
        {
            primary: ["#FFF9A0", "#FFD700"], // walls
            secondary: ["#915d1d", "#4a3010"], // floor
            tertiary: ["#f5a73b", "#f29007"], // skirting
            objectColourPalettes: [
                { primary: ["#C68E17", "#8B5A00"], secondary: ["#8B5A00", "#4f3402"] }, // realistic colour palette
                { primary: ["#FF6B35", "#E85D2C"], secondary: ["#FFE135", "#F4D03F"] } // cartoony colour palette.
            ]
        },
        {
            primary: ["#FFF9A0", "#FFD700"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#bedff7", "#6794c2"],
            objectColourPalettes: [
                { primary: ["#F4A460", "#8B4513"], secondary: ["#ad713e", "#6e3208"] }, // realistic sandy brown
                { primary: ["#87CEEB", "#4682B4"], secondary: ["#FFE4E1", "#FFC0CB"] } // cartoony colour palette.
            ]
        },
        {
            primary: ["#FFF9A0", "#FFD700"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#f7f7f0", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#E0C097", "#8B5A2B"], secondary: ["#ebd2b2", "#9e7146"] }, // realistic cream wood
                { primary: ["#32CD32", "#228B22"], secondary: ["#FFFF00", "#FFD700"] } // cartoony colour palette.
            ]
        }
    ],
    sad: [
        {
            primary: ["#6794c2", "#062e57"],
            secondary: ["#A9A9A9", "#625d66"],
            tertiary: ["#938BA1", "#463366"],
            objectColourPalettes: [
                { primary: ["#062e57", "#6794c2"], secondary: ["#b6babf", "#6b6f73"] }, // realistic 
                { primary: ["#5C1E1E", "#3B2B2B"], secondary: ["#8da0b3", "#2b3742"] } // realistic
            ]
        },
        {
            primary: ["#6794c2", "#062e57"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#3B3B3B", "#1f1d1c"],
            objectColourPalettes: [
                { primary: ["#062e57", "#6794c2"], secondary: ["#b6babf", "#6b6f73"] }, // realistic 
                { primary: ["#708090", "#2F4F4F"], secondary: ["#D3D3D3", "#A9A9A9"] } // complementary.
            ]
        },
        {
            primary: ["#2F4F4F", "#1C3A3A"],
            secondary: ["#696969", "#2F2F2F"],
            tertiary: ["#4682B4", "#36648B"],
            objectColourPalettes: [
                { primary: ["#2F4F4F", "#1C3A3A"], secondary: ["#B0C4DE", "#778899"] }, // realistic 
                { primary: ["#800080", "#4B0082"], secondary: ["#DDA0DD", "#DA70D6"] } // cartoony
            ]
        }
    ],
    angry: [
        {
            primary: ["#B22222", "#c91212"],
            secondary: ["#5C1E1E", "#3b0f0f"],
            tertiary: ["#f7f7f0", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#3B3B3B", "#0A0A0A"], secondary: ["#3B3B3B", "#0A0A0A"] }, // realistic
                { primary: ["#634219", "#4a3010"], secondary: ["#452c0d", "#2b1a05"] } 
            ]
        },
        {
            primary: ["#3B3B3B", "#1f1d1c"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#B22222", "#c91212"],
            objectColourPalettes: [
                { primary: ["#4B2E2E", "#2B1A1A"], secondary: ["#5C1E1E", "#3B2B2B"] }, // realistic 
                { primary: ["#FF4500", "#FF6347"], secondary: ["#000000", "#1C1C1C"] } // cartoony
            ]
        },
        {
            primary: ["#B22222", "#c91212"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#3B3B3B", "#1f1d1c"], 
            objectColourPalettes: [
                { primary: ["#5C1E1E", "#3B2B2B"], secondary: ["#5C1E1E", "#3B2B2B"] }, // realistic dark red
                { primary: ["#FFD700", "#FFA500"], secondary: ["#8B0000", "#DC143C"] } // cartoon contrast.
            ]
        }
    ],
    depressed: [
        {
            primary: ["#1C1C1C", "#3B3B3B"],
            secondary: ["#001F3F", "#09386e"],
            tertiary: ["#242326", "#625f66"],
            objectColourPalettes: [
                { primary: ["#1A1A1A", "#0F0F0F"], secondary: ["#807c7c", "#595757"] }, // realistic
                { primary: ["#4a291a", "#3B2B2B"], secondary: ["#807c7c", "#595757"] } 
            ]
        },
        {
            primary: ["#1C1C1C", "#3B3B3B"],
            secondary: ["#242326", "#625f66"],
            tertiary: ["#1A1A1A", "#0F0F0F"],
            objectColourPalettes: [
                { primary: ["#2A2A2A", "#0F0F0F"], secondary: ["#f7f7f0", "#F5F5F5"] }, // realistic 
                { primary: ["#4a291a", "#3B2B2B"], secondary: ["#adaaaa", "#707070"] } // realistic.
            ]
        },
    ],
    disgusted: [
        {
            primary: ["#d9ff2f", "#ADFF2F"],
            secondary: ["#C1E1C1", "#E0FFD1"],
            tertiary: ["#f2e1c4", "#f3f2f5"],
            objectColourPalettes: [
                { primary: ["#4C3B24", "#2E1F0F"], secondary: ["#f2e1c4", "#f3f2f5"] }, 
                { primary: ["#7A8765", "#5E6B4B"], secondary: ["#4F556B", "#393F52"] }, 
                { primary: ["#4F556B", "#393F52"], secondary: ["#4C3B24", "#2E1F0F"] } 
            ]
        },
        {
            primary: ["#7a5901", "#403006"], // brown (muddy)
            secondary: ["#235428", "#1a381d"], // dark green
            tertiary: ["#521824", "#38040e"], // maroon
            objectColourPalettes: [
                { primary: ["#7a5901", "#403006"], secondary: ["#7a5901", "#403006"] }, // realistic
                { primary: ["#521824", "#38040e"], secondary: ["#7a5901", "#403006"] },
                { primary: ["#8FBC8F", "#556B2F"], secondary: ["#A0522D", "#8B4513"] } // cartoony
            ]
        }
    ],
    love: [
        {
            primary: ["#8b001c", "#eb0c5a"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#f29daa", "#FFC0CB"],
            objectColourPalettes: [
                { primary: ["#6B2F2F", "#4B1F1F"], secondary: ["#f2e1c4", "#ede9df"] }, 
                { primary: ["#5C2525", "#3E1919"], secondary: ["#cf6b7b", "#a33e50"] }, 
                { primary: ["#541d7a", "#3d2052"], secondary: ["#cf6b7b", "#a33e50"] } 
            ]
        },
        {
            primary: ["#8b001c", "#eb0c5a"],
            secondary: ["#590342", "#821665"],
            tertiary: ["#f29daa", "#FFC0CB"],
            objectColourPalettes: [
                { primary: ["#6B2F2F", "#4B1F1F"], secondary: ["#f2e1c4", "#ede9df"] }, 
                { primary: ["#5C2525", "#3E1919"], secondary: ["#cf6b7b", "#a33e50"] }, 
                { primary: ["#541d7a", "#3d2052"], secondary: ["#7d3c96", "#612e75"] } 
            ]
        },
        {
            primary: ["#f29daa", "#FFC0CB"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#8b001c", "#eb0c5a"],
            objectColourPalettes: [
                { primary: ["#6B2F2F", "#4B1F1F"], secondary: ["#f2e1c4", "#ede9df"] }, 
                { primary: ["#5C2525", "#3E1919"], secondary: ["#cf6b7b", "#a33e50"] }, 
                { primary: ["#541d7a", "#3d2052"], secondary: ["#7d3c96", "#612e75"] }
            ]
        },
        {
            primary: ["#8b001c", "#eb0c5a"],
            secondary: ["#590342", "#821665"],
            tertiary: ["#e6ace5", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#6B2F2F", "#4B1F1F"], secondary: ["#f2e1c4", "#ede9df"] }, 
                { primary: ["#5C2525", "#3E1919"], secondary: ["#cf6b7b", "#a33e50"] }, 
                { primary: ["#541d7a", "#3d2052"], secondary: ["#7d3c96", "#612e75"] } 
            ]
        },
        {
            primary: ["#8b001c", "#eb0c5a"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#e6ace5", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#6B2F2F", "#4B1F1F"], secondary: ["#f2e1c4", "#ede9df"] }, 
                { primary: ["#5C2525", "#3E1919"], secondary: ["#cf6b7b", "#a33e50"] }, 
                { primary: ["#541d7a", "#3d2052"], secondary: ["#cf6b7b", "#a33e50"] } 
            ]
        },
        {
            primary: ["#f29daa", "#FFC0CB"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#f7f7f0", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#6B2F2F", "#4B1F1F"], secondary: ["#f2e1c4", "#ede9df"] }, 
                { primary: ["#FF1493", "#FF69B4"], secondary: ["#FFD700", "#FFFF00"] } // cartoony
            ]
        }
    ],
    pride: [
        {
            primary: ["#DC143C", "#B22222"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#D3AF37", "#EFBF04"],
            objectColourPalettes: [
                { primary: ["#4B2E2E", "#2E1B1B"], secondary: ["#D3AF37", "#EFBF04"] }, 
                { primary: ["#FFD700", "#FFA500"], secondary: ["#8B0000", "#DC143C"] } // cartoony
            ]
        },
        {
            primary: ["#131d24", "#0f0f0f"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#D3AF37", "#EFBF04"],
            objectColourPalettes: [
                { primary: ["#131d24", "#0F0F0F"], secondary: ["#e5e3e6", "#f6f5f7"], tertiary:["#D3AF37", "#EFBF04"] },
                { primary: ["#131d24", "#0F0F0F"], secondary: ["#D3AF37", "#EFBF04"], tertiary:  ["#131d24", "#0F0F0F"]},
                { primary: ["#e5e3e6", "#f6f5f7"], secondary: ["#131d24", "#0f0f0f"] } 
            ]
        },
        // royal pride esque palette. (purple is usually associated with royalty.)
        {
            primary: ["#4B0082", "#6A0DAD"],
            secondary: ["#8B5A2B", "#654321"],
            tertiary: ["#FFD700", "#FFA500"],
            objectColourPalettes: [
                { primary: ["#2F4F4F", "#1C3A3A"], secondary: ["#FFD700", "#FFA500"] }, 
                { primary: ["#FF4500", "#FF6347"], secondary: ["#4B0082", "#6A0DAD"] } // contrast
            ]
        }
    ],
    jealousy: [
        // going with 'green with envy' colour scheme. Mabye we can try to add other wall colours later.
        {
            primary: ["#073607", "#08400f"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#D3AF37", "#EFBF04"],
            objectColourPalettes: [
                { primary: ["#274029", "#182818"], secondary: ["#D3AF37", "#EFBF04"] },
                { primary: ["#4B2E2E", "#2E1B1B"], secondary: ["#274029", "#182818"] }
            ]
        },
        // more intense, cartoony jealousy palette
        {
            primary: ["#228B22", "#006400"],
            secondary: ["#2F4F4F", "#1C3A3A"],
            tertiary: ["#8B0000", "#DC143C"],
            objectColourPalettes: [
                { primary: ["#006400", "#013220"], secondary: ["#FFD700", "#FFA500"] }, // cartoony ish
                { primary: ["#FF0000", "#8B0000"], secondary: ["#00FF00", "#32CD32"] } //cartoony
            ]
        }
    ],
    guilt: [
        {
            primary: ["#3c0a61", "#551682"],
            secondary: ["#2C2C2C", "#6b736b"],
            tertiary: ["#CD5C5C", "#8B3A3A"],
            objectColourPalettes: [
                { primary: ["#2A1B2E", "#1A0F1D"], secondary: ["#2C2C2C", "#6b736b"] }, 
                { primary: ["#4B2E2E", "#2E1B1B"], secondary: ["#3c0a61", "#551682"] } 
            ]
        },
        {
            primary: ["#3c0a61", "#551682"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#2C2C2C", "#6b736b"],
            objectColourPalettes: [
                { primary: ["#2A1B2E", "#1A0F1D"], secondary: ["#2C2C2C", "#6b736b"] }, 
                { primary: ["#8B0000", "#4B0000"], secondary: ["#3c0a61", "#551682"] } 
            ]
        },
        // sicky green palette (nauseous with guilt etc etc)
        {
            primary: ["#3E4C2C", "#2C3820"],   
            secondary: ["#4A2C2A", "#3B271F"], 
            tertiary: ["#551682", "#3c0a61"],  
            objectColourPalettes: [
              { primary: ["#3B2A1A", "#2B1C12"], secondary: ["#3E4C2C", "#2C3820"] }, 
              { primary: ["#2C2C2C", "#6b736b"], secondary: ["#551682", "#3c0a61"] }
            ]
          }
    ],
    stressed: [
        {
            primary: ["#FF4500", "#B22222"],
            secondary: ["#b87614", "#d49639"],
            tertiary: ["#ffe208", "#fae755"],
            objectColourPalettes: [
                { primary: ["#804000", "#5A2A00"], secondary: ["#ffe208", "#fae755"] }, // realistic?
                { primary: ["#FF0000", "#8B0000"], secondary: ["#FFFF00", "#FFD700"] } // cartoony
            ]
        },
        // cartoony stressful palette
        {
            primary: ["#FF1493", "#DC143C"],
            secondary: ["#1C1C1C", "#0F0F0F"],
            tertiary: ["#00FFFF", "#00CED1"],
            objectColourPalettes: [
                { primary: ["#2F2F2F", "#1A1A1A"], secondary: ["#FF1493", "#DC143C"] },// cartoony
                { primary: ["#FFFF00", "#FFD700"], secondary: ["#FF00FF", "#8A2BE2"] } // cartoony
            ]
        }
    ],
    calm: [
        {
            primary: ["#abd1cb", "#abdbab"],
            secondary: ["#8f7350", "#8a713b"],
            tertiary: ["#f7f7f0", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#D6E4D4", "#A6C8A1"], secondary: ["#f5e7d0", "#fae6c3"] }, 
                { primary: ["#87CEEB", "#4682B4"], secondary: ["#F0F8FF", "#E6F3FF"] }
            ]
        },
        {
            primary: ["#ADD8E6", "#B0E0E6"],
            secondary: ["#8f7350", "#8a713b"],
            tertiary: ["#f7f7f0", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#B0C4DE", "#A2BFE0"], secondary: ["#f5e7d0", "#fae6c3"] },
                { primary: ["#98FB98", "#90EE90"], secondary: ["#FFE4B5", "#FFDAB9"] } 
            ]
        },
        {
            primary: ["#f2d7f5", "#fbd9ff"],
            secondary: ["#8f7350", "#52422e"],
            tertiary: ["#f7f7f0", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#E6C3D1", "#D9AFC1"], secondary: ["#f5e7d0", "#fae6c3"] }, 
                { primary: ["#DDA0DD", "#DA70D6"], secondary: ["#F0E68C", "#E6E6FA"] } 
            ]
        },
        {
            primary: ["#abd1cb", "#abdbab"],
            secondary: ["#a2bffe", "#779ecb"],
            tertiary: ["#f7f7f0", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#C0D8D4", "#A3C4C9"], secondary: ["#f5e7d0", "#fae6c3"] }, 
            ]
        }
    ],
    lonely: [
        {
            primary: ["#ededed", "#c9c9c9"],
            secondary: ["#f7f7f0", "#F5F5F5"],
            tertiary: ["#A9A9A9", "#625d66"],
            objectColourPalettes: [
                { primary: ["#B0B0B0", "#8C8C8C"], secondary: ["#f7f7f0", "#F5F5F5"] }, 
                { primary: ["#696969", "#2F2F2F"], secondary: ["#D3D3D3", "#C0C0C0"] } 
            ]
        },
        {
            primary: ["#f7f7f0", "#F5F5F5"],
            secondary: ["#ededed", "#c9c9c9"],
            tertiary: ["#A9A9A9", "#625d66"],
            objectColourPalettes: [
                { primary: ["#B0B0B0", "#8C8C8C"], secondary: ["#f7f7f0", "#F5F5F5"] },
                { primary: ["#4682B4", "#36648B"], secondary: ["#F8F8FF", "#F0F0F0"] } 
            ]
        },
        {
            // 'empty' colour palette.
            primary: ["#f7f7f0", "#F5F5F5"],
            secondary: ["#f7f7f0", "#F5F5F5"],
            tertiary: ["#f7f7f0", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#B0B0B0", "#8C8C8C"], secondary: ["#f7f7f0", "#F5F5F5"] }, 
                { primary: ["#f7f7f0", "#F5F5F5"], secondary: ["#f7f7f0", "#F5F5F5"] } 
            ]
        },
        {
            primary: ["#A9A9A9", "#625d66"],
            secondary: ["#A9A9A9", "#625d66"],
            tertiary: ["#A9A9A9", "#625d66"],
            objectColourPalettes: [
                { primary: ["#B0B0B0", "#8C8C8C"], secondary: ["#f7f7f0", "#F5F5F5"] }, 
                { primary: ["#708090", "#2F4F4F"], secondary: ["#DCDCDC", "#D3D3D3"] } 
            ]
        }
    ],
    excited: [
        // neon esque colour palettes; might need to add in more realistic excited rooms later.
        {
            primary: ["#FF69B4", "#FF1493"],
            secondary: ["#DA70D6", "#BA55D3"],
            tertiary: ["#00BFFF", "#1E90FF"],
            objectColourPalettes: [
                { primary: ["#8B008B", "#6A0DAD"], secondary: ["#FFFC00", "#fbff00"] },
                { primary: ["#FF4500", "#FF6347"], secondary: ["#00FF00", "#32CD32"] } // cartoony high energy
            ]
        },
        {
            primary: ["#00BFFF", "#1E90FF"],
            secondary: ["#DA70D6", "#BA55D3"],
            tertiary: ["#FFFC00", "#fbff00"],
            objectColourPalettes: [
                { primary: ["#002366", "#1A1A8A"], secondary: ["#DA70D6", "#BA55D3"] }, // realistic navy with orchid
                { primary: ["#002366", "#1A1A8A"], secondary: ["#FFFC00", "#fbff00"] }, // navy with yellow
                { primary: ["#FF1493", "#DC143C"], secondary: ["#00FFFF", "#00CED1"] } // ADDED: hot pink with cyan (electric)
            ]
        },
        // ADDED: Neon party palette
        {
            primary: ["#FF00FF", "#8A2BE2"],
            secondary: ["#1C1C1C", "#0F0F0F"],
            tertiary: ["#00FF00", "#32CD32"],
            objectColourPalettes: [
                { primary: ["#2F2F2F", "#1A1A1A"], secondary: ["#FF00FF", "#8A2BE2"] }, // realistic
                { primary: ["#FFFF00", "#FFD700"], secondary: ["#FF0000", "#8B0000"] } // cartoony contrast/ clashing colours
            ]
        }
    ],
    anxious: [
        // insane asylumn white colour scheme.
        {
            primary: ["#FFFFFF", "#F0F0F0"],      
            secondary: ["#E8E8E8", "#DADADA"],   
            tertiary: ["#F5F5F5", "#ECECEC"],    
            objectColourPalettes: [
                { primary: ["#C0C0C0", "#A9A9A9"], secondary: ["#D3D3D3", "#B0B0B0"]},
                { primary: ["#B0B0B0", "#909090"], secondary: ["#C0C0C0", "#A0A0A0"],}
            ]
        },
    
        // basement esque grey colour palette.
        {
            primary: ["#B0B0B0", "#9C9C9C"],     
            secondary: ["#A0A0A0", "#888888"],   
            tertiary: ["#C0C0C0", "#B0B0B0"],  
            objectColourPalettes: [
                { primary: ["#2F2F2F", "#1C1C1C"],secondary: ["#3B2A1A", "#2B1D14"]},
                { primary: ["#3E2C1F", "#2E1B14"], secondary: ["#1C1C1C", "#2F2F2F"],}
            ]
        },
    
        // Rising red panic colour scheme.
        {
            primary: ["#D96459", "#C94C4C"],    
            secondary: ["#7B5A4E", "#5C3D2E"],   
            tertiary: ["#E8DCD3", "#DAD0C5"],  
            objectColourPalettes: [
                { primary: ["#8B3A3A", "#5C1F1F"], secondary: ["#C94C4C", "#D96459"],},
                { primary: ["#7B2C2C", "#5A1E1E"], secondary: ["#D96C5C", "#E87C6C"],}
            ]
        }
    ],  
    content: [
        {
            primary: ["#FDEFB2", "#FAEBD7"],
            secondary: ["#FDE992", "#F5F5F5"],
            tertiary: ["#e3c565", "#ad8b1c"],
            objectColourPalettes: [
                { primary: ["#d6b85a", "#c8a951"], secondary: ["#c9bb8e", "#dfc98a"] }, 
                { primary: ["#804000", "#5A2A00"], secondary: ["#915d1d", "#4a3010"] }, // realistic
                {primary: ["#f5e7d0", "#F5F5F5"], secondary:  ["#f5e7d0", "#F5F5F5"]}// lighter furnitire realistic
            ]
        },
        {
            primary: ["#F5DEB3", "#DEB887"],
            secondary: ["#8B7355", "#696969"],
            tertiary: ["#E6E6FA", "#D8BFD8"],
            objectColourPalettes: [
                { primary: ["#A0522D", "#8B4513"], secondary: ["#F5DEB3", "#DEB887"] }, // realistic 
                { primary: ["#804000", "#5A2A00"], secondary: ["#915d1d", "#4a3010"] }, 
                {primary: ["#f5e7d0", "#F5F5F5"], secondary:  ["#f5e7d0", "#F5F5F5"]}
            ]
        }
    ],
    inspired: [
        {
            primary: ["#40E0D0", "#48D1CC"],
            secondary: ["#915d1d", "#b0783c"],
            tertiary: ["#FFEB3B", "#FFF44F"],
            objectColourPalettes: [
                { primary: ["#2C6666", "#1F4F4F"], secondary: ["#073607", "#228B22"] }, // realistic teal with forest green
                { primary: ["#FF4500", "#FF6347"], secondary: ["#9400D3", "#8A2BE2"] } // ADDED: orange with violet (creative spark)
            ]
        },
        {
            primary: ["#40E0D0", "#48D1CC"],
            secondary: ["#915d1d", "#b0783c"],
            tertiary: ["#FF7F50", "#FF6F61"],
            objectColourPalettes: [
                { primary: ["#2C6666", "#1F4F4F"], secondary: ["#073607", "#228B22"] }, // realistic teal with forest green
                { primary: ["#FFD700", "#FFA500"], secondary: ["#FF1493", "#DC143C"] } // ADDED: gold with hot pink (bold inspiration)
            ]
        },
        {
            primary: ["#F5F5DC", "#FAEBD7"],
            secondary: ["#915d1d", "#4a3010"],
            tertiary: ["#40E0D0", "#48D1CC"],
            objectColourPalettes: [
                { primary: ["#8FA5A5", "#6F8C8C"], secondary: ["#073607", "#228B22"] }, // realistic blue-grey with green
                { primary: ["#9932CC", "#8B008B"], secondary: ["#FFD700", "#FFA500"] } // ADDED: dark orchid with gold (artistic)
            ]
        },
        // ADDED: Aurora inspiration palette
        {
            primary: ["#00CED1", "#20B2AA"],
            secondary: ["#2F4F4F", "#1C3A3A"],
            tertiary: ["#FF69B4", "#FF1493"],
            objectColourPalettes: [
                { primary: ["#4682B4", "#36648B"], secondary: ["#00CED1", "#20B2AA"] }, // realistic steel blue with turquoise
                { primary: ["#ADFF2F", "#32CD32"], secondary: ["#FF4500", "#FF6347"] } // ADDED: lime green with orange-red (aurora colors)
            ]
        }
    ],
    nostalgic: [
        {
            primary: ["#915d1d", "#4a3010"],
            secondary: ["#52330b", "#291903"],
            tertiary: ["#f7f7f0", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#4A3620", "#2E2113"], secondary: ["#4B2E2E", "#2E1B1B"] }, 
                { primary: ["#4A3620", "#2E2113"], secondary: ["#141414", "#0f0f0f"] }, 
                { primary: ["#141414", "#0f0f0f"], secondary: ["#4A3620", "#2E2113"] } 
            ]
        },
        //faded out colour range.
        {
            primary: ["#6D7B8D", "#4B5D6B"],         
            secondary: ["#D8D8D8", "#BEBEBE"],        
            tertiary: ["#F2F2F2", "#EAEAEA"],        
            objectColourPalettes: [
                { primary: ["#6B4F3A", "#8C6E54"], secondary: ["#EEE7DC", "#E1D8CB"] }, 
                { primary: ["#3C4A57", "#2C3945"], secondary: ["#A7B8A8", "#8FA092"] }
            ]
        },
        {
            primary: ["#DCC48E", "#C2A878"],         
            secondary: ["#8D6E63", "#6D4C41"],         
            tertiary: ["#F7F5E6", "#FAF3DD"],         
            objectColourPalettes: [
                { primary: ["#B08968", "#8C6B4F"], secondary: ["#F5EDE1", "#EADFCF"] }, 
                { primary: ["#C2A878", "#A78E6E"], secondary: ["#2B1F1A", "#1A130F"] } 
            ]
        },
        {
            primary: ["#A288A6", "#7D637F"],         
            secondary: ["#CFCFCF", "#BDBDBD"],         
            tertiary: ["#F7F7F7", "#ECECEC"],         
            objectColourPalettes: [
                { primary: ["#A288A6", "#8C6E8D"], secondary: ["#D0BFAF", "#B39C8A"] },
                { primary: ["#6A4E63", "#503B4B"], secondary: ["#F0ECEB", "#E6E1E0"] } 
            ]
        },
        {
            primary: ["#A89F91", "#7E7366"],         
            secondary: ["#CBBFAD", "#B8A99A"],         
            tertiary: ["#EFEFE9", "#F5F5F0"],         
            objectColourPalettes: [
                { primary: ["#6D5D4B", "#5A4C3C"], secondary: ["#C9BFB1", "#B7AC9D"] }, // realistic taupe with mushroom
                { primary: ["#8E8578", "#756C61"], secondary: ["#141414", "#0F0F0F"] }, // grey-brown with black
            ]
        }
    ],
    fearful: [
        {
            primary: ["#5a4461", "#3e2247"],
            secondary: ["#141414", "#0f0f0f"],
            tertiary: ["#f7f7f0", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#3E2A47", "#291A33"], secondary: ["#141414", "#0f0f0f"] }, 
                { primary: ["#8B0000", "#4B0000"], secondary: ["#2F2F2F", "#1A1A1A"] } 
            ]
        },
        {
            primary: ["#5a4461", "#3e2247"],
            secondary: ["#340f40", "#1c0524"],
            tertiary: ["#e0dfde", "#f5f3f2"],
            objectColourPalettes: [
                { primary: ["#351F3F", "#241129"], secondary: ["#B0B0B0", "#9C9C9C"] }, 
                { primary: ["#000000", "#0A0A0A"], secondary: ["#FF0000", "#8B0000"] } 
            ]
        },
        {
            primary: ["#5a4461", "#3e2247"],
            secondary: ["#340f40", "#1c0524"],
            tertiary: ["#141414", "#0f0f0f"],
            objectColourPalettes: [
                { primary: ["#2C1533", "#1A0B1F"], secondary: ["#B0B0B0", "#9C9C9C"] }, 
                { primary: ["#4B0082", "#2E0054"], secondary: ["#FF4500", "#FF6347"] } 
            ]
        },
        {
            primary: ["#5a4461", "#3e2247"],
            secondary: ["#340f40", "#1c0524"],
            tertiary: ["#5c5b5a", "#737270"],
            objectColourPalettes: [
                { primary: ["#2C1533", "#1A0B1F"], secondary: ["#B0B0B0", "#9C9C9C"] },
                { primary: ["#228B22", "#006400"], secondary: ["#8B008B", "#4B0082"] } // cartoony forest eerie vibe.
            ]
        }
    ],
    bored: [
        {
            primary: ["#ede7d1", "#EDEADE"],
            secondary: ["#ededed", "#c9c9c9"],
            tertiary: ["#D2B48C", "#BC987E"],
            objectColourPalettes: [
                { primary: ["#AFA593", "#8F8574"], secondary: ["#ede7d1", "#EDEADE"] }, 
                { primary: ["#708090", "#2F4F4F"], secondary: ["#F5F5DC", "#FAEBD7"] } 
            ]
        },
        {
            primary: ["#F5F5F5", "#E5E5E5"],
            secondary: ["#D3D3D3", "#C0C0C0"],
            tertiary: ["#A9A9A9", "#696969"],
            objectColourPalettes: [
                { primary: ["#B8B8B8", "#A0A0A0"], secondary: ["#F0F0F0", "#E8E8E8"] },
                { primary: ["#8B4513", "#654321"], secondary: ["#DEB887", "#D2B48C"] } 
            ]
        }
    ],
    adventurous: [
        // Jungle explorer
        {
            primary: ["#2E4600", "#1B2E00"],           
            secondary: ["#8B5E3C", "#5C3D2E"],          
            tertiary: ["#F0E6D2", "#E8DDC7"],           
            objectColourPalettes: [
                { primary: ["#4B3621", "#3B2A1A"], secondary: ["#2E4600", "#1B2E00"], tertiary: ["#C2B280", "#6b603e"] }, // realistic wood with jungle green
                { primary: ["#2E4600", "#1B2E00"], secondary: ["#4B3621", "#3B2A1A"], tertiary: ["#FFD700", "#EEC900"] }, // jungle green with wood and gold
                { primary: ["#FF4500", "#DC143C"], secondary: ["#FFFF00", "#FFD700"] } // ADDED: bright orange with yellow (tropical bird colors)
            ]
        },
      
        // Desert adventurer (Indiana Jones / temples)
        {
            primary: ["#C19A6B", "#A67B5B"],           
            secondary: ["#7B3F00", "#5C2C00"],       
            tertiary: ["#FFD700", "#EEC900"],          
            objectColourPalettes: [
                { primary: ["#8B5E3C", "#6D4C41"], secondary: ["#E0C097", "#D2B48C"]}, 
                { primary: ["#7B3F00", "#5C2C00"], secondary: ["#8B5E3C", "#6D4C41"], tertiary: ["#FFD700", "#EEC900"] }, 
            ]
        },
      
        // Ocean adventurer
        {
            primary: ["#003366", "#001F3F"],            
            secondary: ["#8B4513", "#5C3317"],          
            tertiary: ["#C0C0C0", "#B0B0B0"],            
            objectColourPalettes: [
                { primary: ["#3B2A1A", "#2B1D14"], secondary: ["#8B4513", "#5C3317"]}, 
                { primary: ["#003366", "#001F3F"], secondary: ["#3B2A1A", "#2B1D14"], tertiary: ["#FFD700", "#EEC900"] }, 
                { primary: ["#00CED1", "#20B2AA"], secondary: ["#FF4500", "#FF6347"] } // cartoony contrast.
            ]
        },
      
        // Extreme thrill seeker (lava, energy, neon contrasts)
        {
            primary: ["#FF4500", "#CC3700"],            
            secondary: ["#1C1C1C", "#0D0D0D"],         
            tertiary: ["#FFD700", "#FFFF33"],         
            objectColourPalettes: [
                { primary: ["#2B2B2B", "#1C1C1C"], secondary: ["#FF4500", "#CC3700"] }, 
                { primary: ["#FF4500", "#CC3700"], secondary: ["#2B2B2B", "#1C1C1C"]}, 
                { primary: ["#9400D3", "#8A2BE2"], secondary: ["#ADFF2F", "#32CD32"] } // cartoony contrast.
            ]
        }
    ],      
    embarrassed: [
        {
            primary: ["#e8929f", "#FFB6C1"],
            secondary: ["#FFE5B4", "#FFDAB9"],
            tertiary: ["#f7f7f0", "#F5F5F5"],
            objectColourPalettes: [
                { primary: ["#E6B7B7", "#DDAAAA"], secondary: ["#FFE5B4", "#FFDAB9"] }, 
                { primary: ["#DC143C", "#B22222"], secondary: ["#FFFF00", "#FFD700"] } // cartoony
            ]
        },
        {
            primary: ["#FFC0CB", "#FFB6C1"],
            secondary: ["#F0F0F0", "#E0E0E0"],
            tertiary: ["#FF69B4", "#FF1493"],
            objectColourPalettes: [
                { primary: ["#DDA0DD", "#DA70D6"], secondary: ["#F5F5F5", "#FFFFFF"] },
            ]
        }
    ],
    curious: [
        // curious george color scheme
        {
            primary: ["#FFD84D", "#F4C542"],        
            secondary: ["#C62828", "#8E0000"],          
            tertiary: ["#F9F9F9", "#FFFFFF"],       
            objectColourPalettes: [
                { primary: ["#D7B77A", "#C49A6C"], secondary: ["#FAFAFA", "#F0F0F0"] }, 
                { primary: ["#C62828", "#8E0000"], secondary: ["#FFD84D", "#F4C542"] }, 
            ]
        },
      
        // detective scheme
        {
            primary: ["#5C4033", "#3E2C24"],          
            secondary: ["#8D6E63", "#6D4C41"],          
            tertiary: ["#E6E2D3", "#DAD3C8"],         
            objectColourPalettes: [
                { primary: ["#4B3621", "#3B2A1A"], secondary: ["#A67B5B", "#8C6A50"] }, 
                { primary: ["#141414", "#0F0F0F"], secondary: ["#5C4033", "#3E2C24"] },
            ]
        },
       
        // sciency colour scheme
        {
            primary: ["#E6F3FF", "#B3D9FF"],
            secondary: ["#2F4F4F", "#1C3A3A"],
            tertiary: ["#00CED1", "#20B2AA"],
            objectColourPalettes: [
                { primary: ["#4682B4", "#36648B"], secondary: ["#E6F3FF", "#B3D9FF"] }, // realistic
                { primary: ["#FF1493", "#DC143C"], secondary: ["#00FF00", "#32CD32"] } // cartoony vibe
            ]
        }
    ],
    confusion: [
        // Clashing colours.
        {
            primary: ["#9B59B6", "#8E44AD"],        // purple walls
            secondary: ["#E67E22", "#D35400"],      // orange floor (clashing)
            tertiary: ["#2ECC71", "#27AE60"],       // green skirting (more clashing)
            objectColourPalettes: [
                { primary: ["#3498DB", "#2980B9"], secondary: ["#E74C3C", "#C0392B"] }, // blue with red (confusion)
                { primary: ["#F39C12", "#E67E22"], secondary: ["#9B59B6", "#8E44AD"] }  // orange with purple
            ]
        },
        
        // Riddler's colour scheme (from batman)
        {
            primary: ["#39ff14", "#00D100"],        // bright neon green walls
            secondary: ["#4B0082", "#6A0DAD"],      // deep purple floor
            tertiary: ["#1C1C1C", "#0F0F0F"],       // black skirting (contrast)
            objectColourPalettes: [
                { primary: ["#4B0082", "#6A0DAD"], secondary: ["#39ff14", "#00D100"] }, // realistic purple with green
                { primary: ["#1C1C1C", "#0F0F0F"], secondary: ["#39ff14", "#00D100"], tertiary: ["#FFD700", "#FFA500"] }, // black with green and gold accents
                { primary: ["#FF00FF", "#8A2BE2"], secondary: ["#00FF00", "#32CD32"] }  // cartoony neon contrast (question marks everywhere!)
            ]
        }
    ]
};