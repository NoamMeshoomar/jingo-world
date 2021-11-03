/*
    { // Shops Object
        shopId: '61101622819679bc4d4b4fbf',
        shopImage: '/rooms/room0/shops/0.png',
        shopImagePosition: { x: 280, y: 370 }
    }
*/

module.exports = [
    { // 0
        spawnPosition: { x: 550, y: 340 },
        roomBackground: {
            backgroundImage: '/rooms/room0/background.jpg',
            teleports: [
                {
                    teleportImage: '/rooms/room0/teleports/0.png',
                    teleportImagePosition: { x: 1065, y: 457 },
                    teleportTo: 3
                },
                {
                    teleportImage: '/rooms/room0/teleports/1.png',
                    teleportImagePosition: { x: 100, y: 510 },
                    teleportTo: 1
                },
                {
                    teleportImage: '/rooms/room0/teleports/2.png',
                    teleportImagePosition: { x: 730, y: 250 },
                    teleportTo: 2
                },
                {
                    teleportImage: '/rooms/room0/teleports/3.png',
                    teleportImagePosition: { x: 600, y: 245 },
                    teleportTo: 6
                }
            ],
            items: null,
            shops: null,
            drops: {},
            npc: {
                npcImage: '/rooms/room0/npc.png',
                npcPosition: { x: 200, y: 280 },
                npcName: 'צ\'ימי',
                sentences: ['לדעתי הכוכב הזה הרבה יותר נקי ויפה מהקודם!', 'העונה שאני הכי אוהב זה חורף, אני כל כך אוהב גשמים!', 'להיות תושב הקבע הראשי בג\'ינגו זה כבוד גדול וגם אחריות גדולה']
            }
        },
        adminRoom: false,
        users: {},
        chatHistory: [],
        walkablePlaces: (x, y) => {

        }
    },
    { // 1
        spawnPosition: { x: 600, y: 550 },
        roomBackground: {
            backgroundImage: '/rooms/room1/background.jpg',
            teleports: [
                {
                    teleportImage: '/rooms/room1/teleports/0.png',
                    teleportImagePosition: { x: 307, y: 390 },
                    teleportTo: null
                },
                {
                    teleportImage: '/rooms/room1/teleports/1.png',
                    teleportImagePosition: { x: 518, y: 370 },
                    teleportTo: null
                },
                {
                    teleportImage: '/rooms/room1/teleports/2.png',
                    teleportImagePosition: { x: 863, y: 408 },
                    teleportTo: null
                },
                {
                    teleportImage: '/rooms/room1/teleports/3.png',
                    teleportImagePosition: { x: 180, y: 460 },
                    teleportTo: null
                },
                {
                    teleportImage: '/rooms/room1/teleports/4.png',
                    teleportImagePosition: { x: 960, y: 460 },
                    teleportTo: 0
                }
            ],
            items: null,
            shops: null,
            drops: {},
            npc: null
        },
        adminRoom: false,
        users: {},
        chatHistory: [],
        walkablePlaces: (x, y) => {

        }
    },
    { // 2
        spawnPosition: { x: 1200 / 2 - 25, y: 300 },
        roomBackground: {
            backgroundImage: '/rooms/room2/background.jpg',
            teleports: [
                {
                    teleportImage: '/rooms/room2/teleports/0.png',
                    teleportImagePosition: { x: 435, y: 130 },
                    teleportTo: 0
                }
            ],
            items: [
                {
                    itemImage: '/rooms/room2/items/0.png',
                    itemImagePosition: { x: 1200 / 2 - 20, y: 800 / 2 + 180 }
                }
            ],
            shops: null,
            drops: {},
            npc: {
                npcImage: '/rooms/room2/npc.png',
                npcPosition: { x: 645, y: 200 },
                npcName: 'ג\'יים',
                sentences: ['להיות שופט כדורגל זה כל כך כיף! תמיד אהבתי כדורגל', 'אני מת על ספורט, אני אוהב לשחות, לשחק, לרוץ עוד מגיל קטן!', 'תמיד לפני שמתחיל פה במגרש משחק אני כל כך נרגש! אני לא יכול לתאר כמה']
            }
        },
        adminRoom: false,
        users: {},
        chatHistory: [],
        walkablePlaces: (x, y) => {

        }
    },
    { // 3
        spawnPosition: { x: 520, y: 400 },
        roomBackground: {
            backgroundImage: '/rooms/room3/background.jpg',
            teleports: [
                {
                    teleportImage: '/rooms/room3/teleports/0.png',
                    teleportImagePosition: { x: 70, y: 550 },
                    teleportTo: 0
                }
            ],
            items: null,
            shops: [
                {
                    shopId: '61101622819679bc4d4b4fbf',
                    shopImage: '/rooms/room3/shops/0.png',
                    shopImagePosition: { x: 1200 / 2, y: 340 }
                }
            ],
            drops: {},
            npc: {
                npcImage: '/rooms/room3/npc.png',
                npcPosition: { x: 250, y: 280 },
                npcName: 'ג\'ון',
                sentences: ['להיות המדען של ג\'ינגו זאת אחריות גדולה אבל ממש מהנה', 'כבר ראיתם את חנות המעבדה? מוזמנים לרכוש בה פריטים לעצמכם!', 'אני זוכר שפעם כשאני וצ\'ימי צפינו בחלל ראינו את כוכב באנג\'י, איזה געגועים..']
            }
        },
        adminRoom: false,
        users: {},
        chatHistory: [],
        prize: null,
        walkablePlaces: (x, y) => {

        }
    },
    { // 4
        spawnPosition: { x: 300, y: 550 },
        roomBackground: {
            backgroundImage: '/rooms/room4/background.jpg',
            teleports: [
                {
                    teleportImage: '/rooms/room4/teleports/0.png',
                    teleportImagePosition: { x: 300, y: 373 },
                    teleportTo: 7
                },
                {
                    teleportImage: '/rooms/room4/teleports/1.png',
                    teleportImagePosition: { x: 880, y: 130 },
                    teleportTo: 0
                }
            ],
            items: null,
            shops: null,
            drops: {},
            npc: null
        },
        adminRoom: true,
        users: {},
        chatHistory: [],
        walkablePlaces: (x, y) => {

        }
    },
    { // 5
        spawnPosition: { x: 580, y: 420 },
        roomBackground: {
            backgroundImage: '/rooms/room5/background.jpg',
            teleports: [
                {
                    teleportImage: '/rooms/room5/teleports/0.png',
                    teleportImagePosition: { x: 1100, y: 500 },
                    teleportTo: null
                }
            ],
            items: [
                {
                    itemImage: '/rooms/room5/items/0.png',
                    itemImagePosition: { x: 100, y: 760 }
                },
                {
                    itemImage: '/rooms/room5/items/1.png',
                    itemImagePosition: { x: 1100, y: 760 }
                }
            ],
            shops: null,
            drops: {}
        },
        adminRoom: false,
        users: {},
        chatHistory: [],
        walkablePlaces: (x, y) => {

        }
    },
    { // 6
        spawnPosition: { x: 580, y: 250 },
        roomBackground: {
            backgroundImage: '/rooms/room6/background.jpg',
            teleports: [
                {
                    teleportImage: '/rooms/room6/teleports/0.png',
                    teleportImagePosition: { x: 1100, y: 450 },
                    teleportTo: 0
                }
            ],
            items: null,
            shops: [
                {
                    shopId: '611a7940258143dd8e5c4d1f',
                    shopImage: '/rooms/room6/shops/0.png',
                    shopImagePosition: { x: 800, y: 250 }
                }
            ],
            drops: {},
            npc: {
                npcImage: '/rooms/room6/npc.png',
                npcPosition: { x: 250, y: 250 },
                npcName: 'יניב',
                sentences: ['איזו רוח טובה יש כאן, אני תמיד נהנה להיות בחוף!', 'כבר ראיתם את חנות החוף? לחצו על דוכן הגלידה ורכשו!', 'לפעמים פה בחוף תוכלו לראות חיות, אני ממש אוהב אותן', 'למי שלא מכיר קוראים לי יניב, מגיל קטן תמיד אהבתי את החוף']
            }
        },
        adminRoom: false,
        users: {},
        chatHistory: [],
        walkablePlaces: (x, y) => {

        }
    },
    { // 7
        spawnPosition: { x: 335, y: 515 },
        roomBackground: {
            backgroundImage: '/rooms/room7/background.jpg',
            teleports: [
                {
                    teleportImage: '/rooms/room7/teleports/0.png',
                    teleportImagePosition: { x: 1050, y: 360 },
                    teleportTo: 8
                },
                {
                    teleportImage: '/rooms/room7/teleports/1.png',
                    teleportImagePosition: { x: 165, y: 360 },
                    teleportTo: 9
                },
                {
                    teleportImage: '/rooms/room7/teleports/2.png',
                    teleportImagePosition: { x: 1200 / 2, y: 750 },
                    teleportTo: 4
                }
            ],
            items: null,
            shops: null,
            drops: {},
            npc: null
        },
        adminRoom: true,
        users: {},
        chatHistory: [],
        walkablePlaces: (x, y) => {

        }
    },
    { // 8
        spawnPosition: { x: 335, y: 515 },
        roomBackground: {
            backgroundImage: '/rooms/room8/background.jpg',
            teleports: [
                {
                    teleportImage: '/rooms/room8/teleports/0.png',
                    teleportImagePosition: { x: 160, y: 360 },
                    teleportTo: 7
                }
            ],
            items: [
                {
                    itemImage: '/rooms/room8/items/0.png',
                    itemImagePosition: { x: 825, y: 605 }
                }
            ],
            shops: null,
            drops: {},
            npc: null
        },
        adminRoom: true,
        users: {},
        chatHistory: [],
        walkablePlaces: (x, y) => {

        }
    },
    { // 9
        spawnPosition: { x: 260, y: 480 },
        roomBackground: {
            backgroundImage: '/rooms/room9/background.jpg',
            teleports: [
                {
                    teleportImage: '/rooms/room9/teleports/0.png',
                    teleportImagePosition: { x: 120, y: 500 },
                    teleportTo: 10
                },
                {
                    teleportImage: '/rooms/room9/teleports/1.png',
                    teleportImagePosition: { x: 1200 / 2, y: 750 },
                    teleportTo: 7
                }
            ],
            items: [
                {
                    itemImage: '/rooms/room9/items/0.png',
                    itemImagePosition: { x: 610, y: 480 }
                }
            ],
            shops: null,
            drops: {},
            npc: null
        },
        adminRoom: true,
        users: {},
        chatHistory: [],
        walkablePlaces: (x, y) => {

        }
    },
    { // 10
        spawnPosition: { x: 1000, y: 480 },
        roomBackground: {
            backgroundImage: '/rooms/room10/background.jpg',
            teleports: [
                {
                    teleportImage: '/rooms/room10/teleports/0.png',
                    teleportImagePosition: { x: 1100, y: 500 },
                    teleportTo: 9
                }
            ],
            items: [
                {
                    itemImage: '/rooms/room10/items/0.png',
                    itemImagePosition: { x: 610, y: 480 }
                }
            ],
            shops: null,
            drops: {},
            npc: null
        },
        adminRoom: true,
        users: {},
        chatHistory: [],
        walkablePlaces: (x, y) => {

        }
    }
];