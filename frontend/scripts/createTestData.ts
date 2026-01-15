const fs = require("fs");
const { v4: uuid4 } = require("uuid");
const { faker } = require('@faker-js/faker');

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1);
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

const generateHours = (): [string, string] => {
    const openingHour = faker.number.int({ min: 0, max: 23 });
    const closingHour = faker.number.int({ min: openingHour + 1, max: 24 });
    return [`${String(openingHour).padStart(2, '0')}:00`, `${String(closingHour).padStart(2, '0')}:00`];
};

const categories: Categories[] = [
    "Urgent Needs",
    "Health & Wellness",
    "Family & Pets",
    "Specialized",
    "Help",
    "Find Work",
];

const createRandomResource = (): MapResource => ({
    _id: uuid4(),
    latitude: randomRange(34, 37),
    longitude: -randomRange(85, 87),
    name: `${capitalize(faker.word.adjective())} ${capitalize(faker.word.noun())}`,
    phone: faker.phone.number({ style: 'national' }),
    address: faker.location.streetAddress(),
    id_required: Math.random() < 0.5,
    category: categories[faker.number.int({ min: 0, max: 5 })],
    hours: {
        Monday: generateHours(),
        Tuesday: generateHours(),
        Wednesday: generateHours(),
        Thursday: generateHours(),
        Friday: generateHours(),
        Saturday: generateHours(),
        Sunday: generateHours()
    }
})

const resources = faker.helpers.multiple(createRandomResource, { count: 300 });
fs.writeFileSync("output.json", JSON.stringify(resources, null, 4));