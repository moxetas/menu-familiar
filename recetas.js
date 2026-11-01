'use strict';

// ---------- Recetas y calorías ----------
//
// ALIMENTOS: valores por 100 g del alimento TAL COMO SE COMPRA (pescado entero con espinas, pollo con hueso,
// mejillones con concha…), para que encaje con las cantidades de las recetas.
//   nombre | kcal | proteínas | grasas | hidratos | extras
//   extras: u = gramos por unidad (1 huevo, 1 cebolla, 1 diente de ajo…), c = gramos por cucharada,
//           l = gramos por lata o bote, d = densidad (ml → g)
// Fuente orientativa: tablas BEDCA y USDA, redondeadas. Son valores aproximados.

const ALIMENTOS_TXT = `
merluza|71|16|1|0
almeja|20|3|0.3|1
mejillon|30|4|0.8|1.4
gamba|50|10|0.8|0
langostino|50|10|0.8|0
calamar|92|16|1.4|3
sepia|79|16|0.7|0.8
pulpo|82|15|1|2
bacalao|82|18|0.7|0
salmon|208|20|13|0
dorada|55|11|1|0
lubina|55|10|1.5|0
sardina|85|11|4.5|0
boqueron|85|12|4|0
rape|76|16|1.5|0
atun|130|23|5|0|l56
atun en lata|198|29|8|0|l56
bonito|138|21|6|0
trucha|70|12|2.5|0
emperador|121|20|4|0
caballa|120|11|8.5|0
lenguado|50|10|0.8|0
anchoa|210|29|10|0|u4
carne picada|250|17|20|0
ternera|160|20|9|0
filete de ternera|130|21|5|0
morcillo|140|20|6|0
lomo de cerdo|155|21|7|0
costilla de cerdo|200|14|16|0
costilla|200|14|16|0
solomillo de cerdo|120|21|4|0
carrillera|170|20|10|0
secreto iberico|310|16|27|0
chuleta de cerdo|190|17|13|0
conejo|110|18|4|0
pollo|150|16|9.5|0
pechuga de pollo|110|23|1.5|0
pechuga de pavo|107|24|1|0
pavo|107|24|1|0
muslo de pollo|160|16|10|0
alita de pollo|150|14|10|0
gallina|180|15|13|0
chorizo|455|24|38|2|u100
morcilla|380|15|34|2|u100
panceta|395|15|37|0
tocino|640|9|67|0
bacon|405|14|39|1
jamon serrano|241|31|13|0|u15
jamon york|110|18|3.5|1|u20
lacon|200|18|14|0
hueso|0|0|0|0|u100
huevo|143|12.6|9.5|0.7|u55
leche|46|3.2|1.6|4.8
leche de coco|197|2|21|3|l400
nata|195|2.5|18|4|c15
mantequilla|742|0.6|82|0.5|c14
queso|380|25|30|0.5|u20
queso rallado|400|30|30|1|c7
mozzarella|250|18|19|2|u125
parmesano|392|36|26|3|c7
quesito|240|10|20|5|u16
yogur|61|3.5|3.3|4.7|u125
arroz|354|7|0.6|78
pasta|357|12|1.5|72
macarron|357|12|1.5|72
espagueti|357|12|1.5|72
fideo|357|12|1.5|72
placa de lasana|357|12|1.5|72|u17
placa de canelon|357|12|1.5|72|u8
noqui|150|3.5|0.5|33
cuscus|361|13|1|72
harina|340|10|1|72|c10
pan rallado|395|13|5|72|c8
pan|270|9|3|51|u250
pan de molde|265|8|4|48|u25
pan de hamburguesa|270|9|4|49|u60
pan de pita|275|9|1|55|u60
tortilla de trigo|300|8|7|50|u40
masa de pizza|280|7|6|48
masa de empanada|330|6|16|40
masa quebrada|470|6|27|52
garbanzo|364|19|6|61
garbanzo cocido|140|8|2.5|20|l250
lenteja|352|24|1|60
lenteja cocida|116|9|0.4|20|l250
alubia|335|21|1.5|60
fabe|335|21|1.5|60
azucar|400|0|0|100|c12
aceite de oliva|884|0|100|0|c13.5|d0.92
aceite|884|0|100|0|c13.5|d0.92
vinagre|18|0|0|0.5|c15
sal|0|0|0|0|c18
pimienta|0|0|0|0
pimenton|282|14|13|54|c7
comino|375|18|22|44|c6
curry|325|14|14|56|c6
azafran|0|0|0|0
oregano|265|9|4|69|c3
laurel|313|8|8|75|u0.2
tomate triturado|32|1.5|0.2|5|l400
tomate frito|80|1.5|4|9|c15|l400
salsa de soja|53|8|0.6|5|c15
mayonesa|680|1|75|1|c14
mostaza|66|4|4|6|c15
tahini|595|17|54|21|c15
vino|83|0|0|2.6
caldo|6|1|0.2|0.5
caldo de pollo|6|1|0.2|0.5
caldo de pescado|6|1|0.2|0.5
caldo de verdura|6|1|0.2|0.5
caldo de carne|6|1|0.2|0.5
caldo de cocido|6|1|0.2|0.5
tinta de calamar|70|1|0.5|10|u4
almendra|576|21|50|9
pinon|673|14|68|13
pasa|299|3|0.5|79
aceituna|145|1|15|4|u4
maiz dulce|86|3|1|19|l140
maiz|86|3|1|19|l140
ajo|119|5|0.5|24|u5
cebolla|40|1.1|0.1|9|u150
patata|77|2|0.1|17|u200
zanahoria|41|0.9|0.2|10|u80
pimiento rojo|31|1|0.3|6|u180
pimiento verde|20|0.9|0.2|4.6|u150
pimiento|26|1|0.3|5|u160
pimiento choricero|280|12|8|40|u8
pimiento de padron|20|1|0.2|4|u10
guindilla|40|2|0.4|9|u2
tomate|18|0.9|0.2|3.9|u150
calabacin|17|1.2|0.3|3.1|u250
berenjena|25|1|0.2|6|u300
puerro|31|1.5|0.3|7|u150
calabaza|26|1|0.1|6.5
judia verde|31|1.8|0.2|7
brocoli|34|2.8|0.4|7|u400
coliflor|25|1.9|0.3|5|u800
champinon|22|3|0.3|3.3
seta|30|3|0.4|4
alcachofa|22|1.3|0.1|4.5|u120
espinaca|23|2.9|0.4|3.6
acelga|19|1.8|0.2|3.7
lechuga|15|1.4|0.2|2.9|u400
pepino|15|0.7|0.1|3.6|u250
limon|29|1.1|0.3|9|u100
manzana|52|0.3|0.2|14|u180
platano|89|1.1|0.3|23|u120
aguacate|160|2|15|9|u150
perejil|36|3|0.8|6
albahaca|23|3.2|0.6|2.7
hierbabuena|44|3.3|0.7|8
esparrago triguero|20|2.2|0.1|3.9
esparrago|20|2.2|0.1|3.9
repollo|25|1.3|0.1|6
guisante|81|5.4|0.4|14
agua|0|0|0|0
leche entera|65|3.2|3.6|4.7
requeson|98|11|4|3.4
bechamel|130|4|8|10|c15
salchicha|300|12|27|2|u50
hamburguesa|250|17|20|0|u120
cordero|250|17|20|0
tofu|76|8|4.8|1.9
quinoa|368|14|6|64
avena|389|17|7|66|c10
galleta|480|6|20|70|u8
boniato|86|1.6|0.1|20|u300
judion|300|20|1.5|55
col|25|1.3|0.1|6
naranja|47|0.9|0.1|12|u200
pera|57|0.4|0.1|15|u180
fresa|32|0.7|0.3|7.7
lima|30|0.7|0.2|10|u70
cebolleta|32|1.8|0.2|7|u50
chalota|72|2.5|0.1|17|u30
apio|16|0.7|0.2|3|u60
rucula|25|2.6|0.7|3.7
cilantro|23|2|0.5|4
jengibre|80|1.8|0.8|18
canela|247|4|1|81|c8
nuez moscada|525|6|36|49|c7
nuez|654|15|65|14
ketchup|112|1.2|0.1|26|c17
miel|304|0.3|0|82|c21
chocolate|530|7|31|55
cerveza|43|0.5|0|3.6
bogavante|32|6.5|0.3|0
caviar|264|25|18|4
`;

// Recetas para 4 personas de las ideas del catálogo.
// [tiempo, ingredientes separados por «;», pasos separados por «|»]
const RECETAS = {
  // ---------- Pescado ----------
  'Merluza en salsa verde': ['30 min',
    '800 g merluza en rodajas; 300 g almejas; 4 dientes ajo; 15 g perejil; 1 cda harina; 100 ml vino blanco; 250 ml caldo de pescado; 4 cdas aceite de oliva; sal',
    'Deja las almejas 30 minutos en agua con sal para que suelten la arena.|Sala la merluza. En una cazuela ancha, dora a fuego suave el ajo picado en el aceite.|Añade la harina, remueve 1 minuto y echa el vino; deja que reduzca 2 minutos.|Vierte el caldo poco a poco moviendo la cazuela hasta que la salsa espese un poco.|Coloca la merluza y las almejas, tapa y cuece 5–6 minutos moviendo la cazuela de vez en cuando.|Espolvorea el perejil picado y sirve enseguida.'],
  'Bacalao a la vizcaína': ['60 min (y 48 h de desalado)',
    '800 g bacalao desalado; 6 pimientos choriceros; 2 cebollas; 3 dientes ajo; 200 g tomate triturado; 5 cdas aceite de oliva; sal',
    'El bacalao tiene que estar desalado: 48 horas en agua fría en la nevera, cambiando el agua 3 veces al día.|Pon los pimientos choriceros en remojo en agua templada 1 hora y raspa la carne con una cuchara.|Pocha a fuego lento la cebolla y el ajo picados en el aceite durante 20 minutos.|Añade la carne de los choriceros y el tomate, cocina 15 minutos y tritura la salsa.|Coloca el bacalao en una cazuela con la piel hacia arriba, cúbrelo con la salsa y cuece a fuego suave 10 minutos. Prueba antes de salar: el bacalao ya lo es.'],
  'Salmón al horno con limón': ['35 min',
    '700 g salmón; 2 limones; 600 g patatas; 3 cdas aceite de oliva; sal; pimienta',
    'Precalienta el horno a 200 °C.|Corta las patatas en rodajas finas, ponlas en una bandeja con la mitad del aceite y sal, y hornéalas 20 minutos.|Coloca encima el salmón salpimentado y rodajas de limón, y riega con el resto del aceite y el zumo de medio limón.|Hornea 12–15 minutos más, hasta que el salmón esté jugoso por dentro.|Sirve con más limón al gusto.'],
  'Dorada a la sal': ['35 min',
    '1200 g dorada entera; 2 kg sal gruesa; 1 limón; 2 cdas aceite de oliva',
    'Precalienta el horno a 220 °C. Limpia las doradas por dentro pero sin quitarles las escamas.|Mezcla la sal gruesa con un poco de agua para que quede como arena mojada.|Pon una capa de sal en una bandeja, coloca encima las doradas con unas rodajas de limón en la tripa y cúbrelas del todo con el resto.|Hornea 20–25 minutos.|Rompe la costra de sal, quita la piel y sirve los lomos con un chorrito de aceite.'],
  'Lubina a la espalda': ['30 min',
    '1200 g lubina entera; 4 dientes ajo; 1 guindilla; 1 limón; 6 cdas aceite de oliva; 1 cda vinagre; sal',
    'Precalienta el horno a 200 °C. Pide en la pescadería que te abran las lubinas a la espalda.|Ponlas abiertas en una bandeja con la piel hacia abajo, sálalas y riégalas con un poco de aceite.|Hornea 12–15 minutos según el tamaño.|Mientras, dora el ajo laminado y la guindilla en el resto del aceite. Fuera del fuego, añade el vinagre.|Vierte el refrito sobre las lubinas y sirve con limón.'],
  'Sardinas a la plancha': ['15 min',
    '1000 g sardinas enteras; 1 limón; 2 cdas aceite de oliva; 10 g perejil; sal gruesa',
    'Limpia las sardinas quitándoles las tripas y lávalas con agua fría. Sécalas bien.|Calienta mucho la plancha con un poco de aceite.|Échales sal gruesa y hazlas 2–3 minutos por cada lado.|Sirve con perejil picado, un chorrito de aceite y limón.'],
  'Boquerones fritos': ['25 min',
    '800 g boquerones enteros; 100 g harina; 60 ml aceite de oliva (lo que absorbe la fritura); 1 limón; sal',
    'Limpia los boquerones quitando la cabeza y las tripas. Lávalos y sécalos bien.|Sálalos y pásalos por harina, sacudiendo la que sobre.|Fríelos en abundante aceite muy caliente, en tandas pequeñas, 1–2 minutos hasta que estén dorados.|Escúrrelos sobre papel de cocina y sirve con limón.'],
  'Calamares a la romana': ['30 min',
    '800 g calamares; 120 g harina; 2 huevos; 60 ml aceite de oliva (lo que absorbe la fritura); 1 limón; sal',
    'Limpia los calamares y córtalos en anillas. Sécalos bien y sálalos.|Pásalos por harina y después por huevo batido.|Fríelos en tandas en aceite abundante muy caliente hasta que estén dorados.|Escúrrelos sobre papel de cocina y sirve enseguida con limón.'],
  'Sepia a la plancha con alioli': ['20 min',
    '800 g sepia; 2 dientes ajo; 1 huevo; 120 ml aceite de oliva (para el alioli); 2 cdas aceite de oliva; 10 g perejil; 1 limón; sal',
    'Limpia la sepia y córtala en trozos grandes. Sécala bien.|Para el alioli: pon en el vaso de la batidora el huevo, 1 diente de ajo, sal y los 120 ml de aceite. Bate sin mover hasta que espese y luego sube y baja la batidora.|Calienta la plancha con un poco de aceite y haz la sepia 3–4 minutos por cada lado.|Al final, échale el otro ajo y el perejil picados con un chorrito de aceite.|Sirve con el alioli y limón.'],
  'Pulpo a la gallega': ['60 min',
    '1500 g pulpo; 800 g patatas; 1 cda pimentón; 4 cdas aceite de oliva; sal gruesa',
    'Si el pulpo es fresco, congélalo antes al menos 2 días para que quede tierno (o cómpralo ya cocido).|Pon a hervir una olla grande con agua. «Asusta» el pulpo: mételo y sácalo tres veces y luego déjalo dentro.|Cuécelo unos 40 minutos, hasta que al pincharlo entre bien. Déjalo reposar 10 minutos en el agua.|En esa misma agua cuece las patatas peladas y en rodajas unos 20 minutos.|Corta el pulpo con tijeras sobre las patatas y termina con sal gruesa, pimentón y aceite.'],
  'Mejillones al vapor': ['15 min',
    '2000 g mejillones con concha; 1 limón; 2 hojas laurel; 100 ml vino blanco',
    'Limpia los mejillones raspando las conchas y quitando las barbas. Tira los que estén abiertos.|Pon en una olla el vino, el laurel y unas rodajas de limón, y añade los mejillones.|Tapa y cocina a fuego fuerte 4–5 minutos, moviendo la olla, hasta que se abran.|Tira los que no se hayan abierto y sirve con limón.'],
  'Marmitako de bonito': ['50 min',
    '600 g bonito; 800 g patatas; 1 pimiento verde; 1 cebolla; 2 dientes ajo; 200 g tomate triturado; 1 l caldo de pescado; 4 cdas aceite de oliva; sal',
    'Pica la cebolla, el pimiento y el ajo y póchalos en el aceite 10 minutos en una cazuela.|Añade el tomate y cocina 5 minutos más.|Echa las patatas peladas y «cascadas» (rompiendo el último corte para que suelten almidón) y rehoga 2 minutos.|Cubre con el caldo caliente y cuece 20–25 minutos, hasta que las patatas estén tiernas.|Apaga el fuego, añade el bonito en dados con sal y deja reposar tapado 5 minutos: se hace con el calor.'],
  'Rape en salsa de almendras': ['40 min',
    '1000 g rape en rodajas; 60 g almendras; 3 dientes ajo; 1 cebolla; 1 rebanada pan; 100 ml vino blanco; 300 ml caldo de pescado; 1 pizca azafrán; 1 cda harina; 5 cdas aceite de oliva; sal',
    'Sala el rape, pásalo por harina y dóralo en el aceite. Resérvalo.|En el mismo aceite fríe las almendras, el ajo y el pan hasta que se doren. Tritúralos con un poco de caldo.|Pocha la cebolla picada 10 minutos, añade el vino y deja que reduzca.|Agrega el majado de almendras, el azafrán y el resto del caldo, y cuece 5 minutos.|Incorpora el rape y cocina 6–8 minutos a fuego suave.'],
  'Atún encebollado': ['40 min',
    '700 g atún fresco; 4 cebollas; 2 dientes ajo; 1 hoja laurel; 150 ml vino blanco; 5 cdas aceite de oliva; sal; pimienta',
    'Corta las cebollas en juliana y póchalas a fuego lento en el aceite con el ajo y el laurel 25 minutos, hasta que estén muy blandas.|Añade el vino y deja que se evapore el alcohol.|Corta el atún en tacos, salpimiéntalo y añádelo a la cebolla.|Cocina solo 3–4 minutos, dándole la vuelta: si se hace de más, queda seco.'],
  'Trucha a la navarra': ['25 min',
    '1200 g truchas enteras; 4 lonchas jamón serrano; 60 g harina; 6 cdas aceite de oliva; 1 limón; sal',
    'Limpia las truchas, sécalas y sálalas por dentro.|Mete una loncha de jamón dentro de cada trucha.|Pásalas por harina y fríelas en el aceite 4–5 minutos por cada lado.|Sirve con limón.'],
  'Emperador a la plancha': ['15 min',
    '800 g emperador; 2 dientes ajo; 10 g perejil; 1 limón; 4 cdas aceite de oliva; sal',
    'Pica el ajo y el perejil y mézclalos con el aceite y un poco de zumo de limón.|Sala los filetes de emperador.|Hazlos en la plancha muy caliente 2–3 minutos por cada lado.|Sirve con el aliño de ajo y perejil por encima.'],
  'Caballa al horno con verduras': ['40 min',
    '1000 g caballa entera; 600 g patatas; 1 cebolla; 1 pimiento rojo; 4 cdas aceite de oliva; 50 ml vino blanco; sal',
    'Precalienta el horno a 200 °C.|Corta las patatas, la cebolla y el pimiento en rodajas finas, ponlos en una bandeja con la mitad del aceite y sal, y hornea 20 minutos.|Coloca encima las caballas limpias y saladas, y riega con el vino y el resto del aceite.|Hornea 15 minutos más.'],
  'Bacalao al pil pil': ['40 min (y 48 h de desalado)',
    '800 g bacalao desalado; 6 dientes ajo; 1 guindilla; 200 ml aceite de oliva',
    'El bacalao tiene que estar desalado (48 horas en agua fría, cambiándola 3 veces al día). Sécalo bien.|Dora a fuego suave el ajo laminado y la guindilla en el aceite. Retíralos.|Deja templar el aceite y pon el bacalao con la piel hacia arriba. Cocina a fuego muy suave 5 minutos por cada lado.|Retira el bacalao y mueve la cazuela en círculos (o bate con un colador) hasta que la gelatina del bacalao ligue el aceite en una salsa espesa.|Vuelve a poner el bacalao, cúbrelo con la salsa y decora con el ajo y la guindilla.'],
  'Lenguado a la plancha': ['15 min',
    '1000 g lenguado entero; 1 limón; 3 cdas aceite de oliva; 1 lechuga; 1 cda vinagre; sal',
    'Sala los lenguados limpios y sécalos bien.|Pincela la plancha con aceite y, cuando esté muy caliente, pon los lenguados.|Hazlos 3–4 minutos por cada lado según el grosor.|Sirve con limón y una ensalada de lechuga aliñada con aceite, vinagre y sal.'],
  'Zarzuela de pescado': ['50 min',
    '400 g rape; 400 g merluza; 300 g gambas; 500 g mejillones; 300 g calamares; 200 g tomate triturado; 1 cebolla; 2 dientes ajo; 100 ml vino blanco; 500 ml caldo de pescado; 30 g almendras; 1 pizca azafrán; 4 cdas aceite de oliva; sal',
    'Abre los mejillones al vapor y resérvalos. Pela las gambas.|En una cazuela sofríe la cebolla y el ajo picados en el aceite 10 minutos. Añade el tomate y cocina 10 minutos más.|Agrega el vino, deja que reduzca y vierte el caldo con el azafrán y las almendras picadas.|Añade los calamares en anillas y cuece 10 minutos.|Incorpora el rape y la merluza en trozos y las gambas, y cuece 5–6 minutos. Añade los mejillones al final.'],

  // ---------- Carne ----------
  'Albóndigas en salsa': ['60 min',
    '600 g carne picada; 1 huevo; 40 g pan rallado; 50 ml leche; 2 dientes ajo; 10 g perejil; 1 cebolla; 2 zanahorias; 200 g tomate triturado; 100 ml vino blanco; 250 ml caldo de carne; 30 g harina; 60 ml aceite de oliva; sal',
    'Mezcla la carne con el huevo, el pan rallado mojado en la leche, 1 ajo y el perejil picados, y sal. Forma bolas.|Pásalas por harina y dóralas en el aceite. Resérvalas.|En ese aceite pocha la cebolla, el otro ajo y la zanahoria picados 15 minutos.|Añade el tomate y el vino, deja reducir y vierte el caldo. Cuece 10 minutos y tritura la salsa.|Vuelve a poner las albóndigas en la salsa y cuece 15 minutos a fuego suave.'],
  'Lomo a la plancha con pimientos': ['25 min',
    '600 g lomo de cerdo; 250 g pimientos de Padrón; 600 g patatas; 60 ml aceite de oliva (lo que absorbe la fritura); 2 cdas aceite de oliva; sal gruesa',
    'Corta las patatas en bastones y fríelas en abundante aceite hasta que estén doradas. Escúrrelas y sálalas.|Fríe los pimientos de Padrón en un poco de aceite hasta que se arruguen y échales sal gruesa.|Sala los filetes de lomo y hazlos en la plancha muy caliente 1–2 minutos por cada lado.|Sirve el lomo con los pimientos y las patatas.'],
  'Filetes de ternera empanados': ['30 min',
    '600 g filetes de ternera; 2 huevos; 100 g pan rallado; 600 g patatas; 100 ml aceite de oliva (lo que absorbe la fritura); 1 limón; sal',
    'Sala los filetes y pásalos por huevo batido y después por pan rallado, apretando bien.|Fríelos en aceite caliente 1–2 minutos por cada lado y escúrrelos sobre papel.|Fríe las patatas cortadas en bastones y sálalas.|Sirve con limón.'],
  'Hamburguesas caseras': ['25 min',
    '600 g carne picada; 4 panes de hamburguesa; 1 tomate; 80 g lechuga; 4 lonchas queso; 1 cebolla; 1 cda aceite de oliva; sal; pimienta',
    'Salpimienta la carne, divídela en 4 bolas y aplánalas hasta dejarlas de 1,5 cm de grosor.|Hazlas en una sartén o plancha caliente con unas gotas de aceite, 3–4 minutos por cada lado.|En el último minuto pon encima el queso para que se funda.|Tuesta un poco el pan y monta las hamburguesas con lechuga, tomate y cebolla en rodajas.'],
  'Estofado de ternera': ['2 h',
    '800 g ternera para guisar; 500 g patatas; 3 zanahorias; 1 cebolla; 2 dientes ajo; 150 g guisantes; 200 ml vino tinto; 500 ml caldo de carne; 1 hoja laurel; 1 cda harina; 4 cdas aceite de oliva; sal',
    'Sala la carne en tacos, enharínala y dórala en el aceite en una olla. Resérvala.|En el mismo aceite pocha la cebolla, el ajo y la zanahoria picados 10 minutos.|Vuelve a poner la carne, añade el vino y deja que se evapore el alcohol.|Cubre con el caldo, añade el laurel y cuece tapado a fuego suave 1 hora y media (o 30 minutos en olla rápida).|Añade las patatas en trozos y los guisantes, y cuece 20 minutos más.'],
  'Carrillada al vino tinto': ['3 h',
    '1000 g carrilleras de cerdo; 400 ml vino tinto; 2 cebollas; 2 zanahorias; 2 dientes ajo; 300 ml caldo de carne; 600 g patatas; 1 cda harina; 4 cdas aceite de oliva; sal; pimienta',
    'Quita la grasa a las carrilleras, salpimiéntalas, enharínalas y dóralas en el aceite. Resérvalas.|Pocha la cebolla, la zanahoria y el ajo picados 15 minutos.|Añade las carrilleras y el vino, y deja que reduzca 5 minutos.|Cubre con el caldo y cuece tapado a fuego muy suave 2 horas y media (o 40 minutos en olla rápida), hasta que se deshagan.|Tritura la salsa. Sirve con las patatas cocidas o en puré.'],
  'Costillas de cerdo al horno': ['75 min',
    '1200 g costillas de cerdo; 800 g patatas; 4 dientes ajo; 1 limón; 1 cda pimentón; 4 cdas aceite de oliva; 100 ml vino blanco; sal',
    'Precalienta el horno a 180 °C.|Mezcla el aceite, el ajo picado, el pimentón, el zumo de limón y sal, y unta bien las costillas.|Pon las patatas en rodajas en la bandeja y las costillas encima. Riega con el vino.|Hornea 1 hora, dándoles la vuelta a mitad. Sube a 220 °C los últimos 10 minutos para que se doren.'],
  'Solomillo de cerdo a la mostaza': ['30 min',
    '800 g solomillo de cerdo; 2 cdas mostaza; 200 ml nata para cocinar; 600 g patatas; 2 cdas aceite de oliva; 50 ml vino blanco; sal; pimienta',
    'Cuece las patatas peladas en agua con sal 20 minutos.|Corta el solomillo en medallones, salpimiéntalos y dóralos en el aceite 2 minutos por cada lado. Resérvalos.|En la misma sartén echa el vino, deja que reduzca y añade la nata y la mostaza.|Cuece la salsa 3 minutos, vuelve a poner la carne y cocina 2 minutos más.|Sirve con las patatas.'],
  'Secreto ibérico con patatas': ['30 min',
    '700 g secreto ibérico; 700 g patatas; 2 pimientos verdes; 60 ml aceite de oliva (lo que absorbe la fritura); sal gruesa',
    'Corta las patatas en rodajas y los pimientos en tiras, y fríelos a fuego medio hasta que estén tiernos y dorados. Escúrrelos y sálalos.|Calienta mucho una plancha sin aceite: el secreto ya tiene su grasa.|Haz el secreto 3–4 minutos por cada lado, córtalo en tiras y échale sal gruesa.|Sirve con las patatas y los pimientos.'],
  'Chuletas de cerdo con manzana': ['30 min',
    '1000 g chuletas de cerdo; 3 manzanas; 1 cebolla; 100 ml vino blanco; 2 cdas aceite de oliva; 20 g mantequilla; sal; pimienta',
    'Salpimienta las chuletas y dóralas en el aceite 3–4 minutos por cada lado. Resérvalas.|En la misma sartén pon la mantequilla, la cebolla en juliana y la manzana en gajos, y cocina 10 minutos.|Añade el vino y deja que reduzca.|Vuelve a poner las chuletas, tapa y cocina 3 minutos más.'],
  'Conejo al ajillo': ['50 min',
    '1200 g conejo troceado; 8 dientes ajo; 150 ml vino blanco; 10 g perejil; 1 hoja laurel; 6 cdas aceite de oliva; sal',
    'Sala el conejo y dóralo bien en el aceite a fuego medio-alto, unos 15 minutos.|Añade los ajos enteros con piel un poco aplastados y el laurel, y cocina 5 minutos.|Riega con el vino, tapa y cocina a fuego suave 20 minutos, hasta que esté tierno.|Destapa, deja que se reduzca la salsa y termina con perejil picado.'],
  'Pimientos rellenos de carne': ['60 min',
    '4 pimientos rojos; 500 g carne picada; 1 cebolla; 2 dientes ajo; 200 g tomate frito; 60 g queso rallado; 3 cdas aceite de oliva; sal',
    'Precalienta el horno a 190 °C. Corta la parte de arriba de los pimientos y quita las semillas.|Pocha la cebolla y el ajo picados en el aceite 10 minutos. Añade la carne y sal, y cocina hasta que pierda el color rosa.|Mezcla con la mitad del tomate frito y rellena los pimientos.|Cubre con el resto del tomate y el queso, ponles su «tapa» y hornea 40 minutos.'],
  'Ragú de ternera con puré': ['2 h 30 min',
    '700 g ternera para guisar; 400 g tomate triturado; 2 zanahorias; 1 cebolla; 2 dientes ajo; 150 ml vino tinto; 300 ml caldo de carne; 1000 g patatas; 150 ml leche; 30 g mantequilla; 3 cdas aceite de oliva; sal',
    'Dora la carne en tacos con el aceite y resérvala.|Pocha la cebolla, la zanahoria y el ajo picados 10 minutos.|Vuelve a poner la carne, añade el vino, deja reducir y agrega el tomate y el caldo.|Cuece tapado a fuego suave 2 horas (o 35 minutos en olla rápida), hasta que la carne se deshaga.|Para el puré, cuece las patatas 20 minutos, escúrrelas y aplástalas con la leche caliente, la mantequilla y sal. Sirve el ragú sobre el puré.'],

  // ---------- Pollo y pavo ----------
  'Pollo al ajillo': ['45 min',
    '1200 g pollo troceado; 10 dientes ajo; 150 ml vino blanco; 10 g perejil; 6 cdas aceite de oliva; sal',
    'Sala el pollo y dóralo bien en el aceite a fuego medio, unos 20 minutos, dándole vueltas.|Añade los ajos con piel un poco aplastados y cocina 5 minutos más.|Riega con el vino y deja que se reduzca a fuego vivo.|Tapa y cocina 10 minutos a fuego suave. Termina con perejil picado.'],
  'Pollo asado con patatas': ['90 min',
    '1500 g pollo entero; 800 g patatas; 2 cebollas; 1 limón; 4 dientes ajo; 4 cdas aceite de oliva; 150 ml vino blanco; sal; pimienta',
    'Precalienta el horno a 200 °C.|Pon en una bandeja las patatas y las cebollas en rodajas con sal y la mitad del aceite.|Salpimienta el pollo por dentro y por fuera, mete dentro el limón partido y los ajos, y úntalo con el resto del aceite.|Ponlo sobre las patatas, riega con el vino y hornea 1 hora y cuarto, dándole la vuelta a mitad y regándolo con su jugo.'],
  'Pechuga a la plancha con ensalada': ['20 min',
    '800 g pechugas de pollo; 1 lechuga; 2 tomates; ½ cebolla; 4 cdas aceite de oliva; 1 cda vinagre; sal',
    'Corta las pechugas en filetes finos y sálalos.|Hazlos en la plancha caliente con unas gotas de aceite 2–3 minutos por cada lado.|Prepara la ensalada con la lechuga, el tomate y la cebolla, y alíñala con aceite, vinagre y sal.|Sirve la pechuga con la ensalada.'],
  'Pollo al curry con arroz': ['40 min',
    '700 g pechugas de pollo; 1 cebolla; 2 cdas curry; 400 ml leche de coco; 300 g arroz; 3 cdas aceite de oliva; sal',
    'Cuece el arroz en agua con sal 18 minutos y escúrrelo.|Pocha la cebolla picada en el aceite 8 minutos.|Añade el pollo en dados y sal, y dóralo. Echa el curry y remueve 1 minuto.|Vierte la leche de coco y cocina 10 minutos a fuego suave hasta que espese.|Sirve con el arroz.'],
  'Pollo en pepitoria': ['60 min',
    '1200 g pollo troceado; 1 cebolla; 2 dientes ajo; 40 g almendras; 2 huevos; 150 ml vino blanco; 300 ml caldo de pollo; 1 pizca azafrán; 1 cda harina; 5 cdas aceite de oliva; sal',
    'Cuece los huevos 10 minutos y separa las yemas de las claras.|Sala el pollo, enharínalo y dóralo en el aceite. Resérvalo.|Fríe en el mismo aceite el ajo y las almendras y resérvalos. Pocha la cebolla picada 10 minutos.|Vuelve a poner el pollo, añade el vino, deja reducir y cubre con el caldo. Cuece 30 minutos.|Machaca las almendras, el ajo, las yemas y el azafrán con un poco de caldo, échalo a la cazuela y cuece 5 minutos. Sirve con la clara picada por encima.'],
  'Muslos de pollo al horno': ['60 min',
    '1200 g muslos de pollo; 700 g patatas; 1 cebolla; 1 limón; 3 cdas aceite de oliva; 1 cdta pimentón; sal',
    'Precalienta el horno a 200 °C.|Pon las patatas y la cebolla en rodajas en una bandeja con sal y un poco de aceite.|Unta los muslos con el resto del aceite, el zumo del limón, el pimentón y sal, y colócalos encima.|Hornea 45–50 minutos, dándoles la vuelta a mitad, hasta que la piel esté dorada.'],
  'Pavo con champiñones': ['30 min',
    '700 g pechuga de pavo; 400 g champiñones; 1 cebolla; 200 ml nata para cocinar; 3 cdas aceite de oliva; sal; pimienta',
    'Corta el pavo en tiras, salpimiéntalo y dóralo en el aceite. Resérvalo.|En la misma sartén pocha la cebolla picada 5 minutos y añade los champiñones laminados. Cocina hasta que suelten el agua y se doren.|Vuelve a poner el pavo, añade la nata y cuece 5 minutos.|Queda bien con arroz o patatas.'],
  'Fajitas de pollo': ['30 min',
    '600 g pechugas de pollo; 8 tortillas de trigo; 1 pimiento rojo; 1 pimiento verde; 1 cebolla; 1 aguacate; ½ limón; 1 cdta comino; 1 cdta pimentón; 3 cdas aceite de oliva; sal',
    'Corta el pollo, los pimientos y la cebolla en tiras.|Saltea las verduras en el aceite a fuego fuerte 5 minutos y resérvalas.|Saltea el pollo con sal, comino y pimentón hasta que esté dorado, y mézclalo con las verduras.|Calienta las tortillas y rellénalas con el pollo, las verduras y el aguacate en láminas con unas gotas de limón.'],
  'Pollo al chilindrón': ['60 min',
    '1200 g pollo troceado; 2 pimientos rojos; 1 cebolla; 2 dientes ajo; 400 g tomate triturado; 80 g jamón serrano; 100 ml vino blanco; 4 cdas aceite de oliva; sal',
    'Sala el pollo y dóralo en el aceite. Resérvalo.|Pocha la cebolla, el ajo y los pimientos en tiras 15 minutos. Añade el jamón en tacos.|Incorpora el tomate y cocina 10 minutos.|Vuelve a poner el pollo, riega con el vino y cuece tapado 25 minutos a fuego suave.'],
  'Alitas de pollo al horno': ['50 min',
    '1200 g alitas de pollo; 600 g patatas; 1 limón; 3 dientes ajo; 1 cdta pimentón; 2 cdas aceite de oliva; sal',
    'Precalienta el horno a 210 °C.|Mezcla el aceite, el ajo picado, el zumo de limón, el pimentón y sal, y embadurna las alitas.|Pon las patatas en gajos en una bandeja con las alitas encima.|Hornea 40 minutos, dándoles la vuelta a mitad, hasta que estén crujientes.'],
  'Pollo al limón': ['35 min',
    '700 g pechugas de pollo; 2 limones; 3 dientes ajo; 1 cda harina; 150 ml caldo de pollo; 300 g arroz; 3 cdas aceite de oliva; sal',
    'Cuece el arroz en agua con sal 18 minutos.|Corta el pollo en tiras, sálalo, enharínalo y dóralo en el aceite.|Añade el ajo laminado, el zumo y la ralladura de los limones, y el caldo.|Cocina 5 minutos, hasta que la salsa espese. Sirve con el arroz.'],

  // ---------- Verdura ----------
  'Menestra de verduras': ['45 min',
    '4 alcachofas; 300 g judías verdes; 200 g guisantes; 2 zanahorias; 100 g jamón serrano; 1 cebolla; 2 dientes ajo; 1 cda harina; 4 cdas aceite de oliva; sal',
    'Limpia las alcachofas y cuécelas 15 minutos en agua con sal. Cuece aparte las judías, la zanahoria y los guisantes 10 minutos y guarda un vaso del agua.|Pocha la cebolla y el ajo picados en el aceite. Añade el jamón en tacos.|Echa la harina, remueve y añade el vaso de agua de cocer las verduras.|Incorpora todas las verduras escurridas y cocina 5 minutos para que se mezclen los sabores.'],
  'Pisto con huevo': ['50 min',
    '1 calabacín; 1 berenjena; 1 pimiento rojo; 1 pimiento verde; 1 cebolla; 400 g tomate triturado; 4 huevos; 5 cdas aceite de oliva; 1 cdta azúcar; sal',
    'Pica todas las verduras en dados pequeños.|Pocha la cebolla y los pimientos en el aceite 10 minutos.|Añade la berenjena y el calabacín y cocina 15 minutos más.|Incorpora el tomate, el azúcar y sal, y cocina 15 minutos a fuego suave.|Sirve con un huevo frito o a la plancha encima.'],
  'Crema de calabaza': ['40 min',
    '1000 g calabaza; 1 puerro; 1 patata; 1 zanahoria; 750 ml caldo de verduras; 2 cdas aceite de oliva; sal',
    'Pela y trocea la calabaza, la patata y la zanahoria. Corta el puerro en rodajas.|Rehoga el puerro en el aceite 5 minutos.|Añade el resto de verduras, cubre con el caldo y cuece 25 minutos.|Tritura hasta que quede fina y prueba de sal.'],
  'Crema de calabacín': ['35 min',
    '3 calabacines; 1 puerro; 1 patata; 4 quesitos; 600 ml caldo de verduras; 2 cdas aceite de oliva; sal',
    'Corta el puerro y rehógalo en el aceite 5 minutos.|Añade el calabacín y la patata en trozos y rehoga 2 minutos.|Cubre con el caldo y cuece 20 minutos.|Añade los quesitos y tritura hasta que quede fina.'],
  'Judías verdes con patata': ['35 min',
    '800 g judías verdes; 600 g patatas; 3 dientes ajo; 1 cdta pimentón; 4 cdas aceite de oliva; sal',
    'Quita las puntas a las judías y córtalas en trozos. Pela y trocea las patatas.|Cuece todo en agua con sal 20 minutos y escurre.|Dora el ajo laminado en el aceite, aparta del fuego y añade el pimentón.|Vierte el refrito sobre las judías y las patatas y mezcla.'],
  'Berenjenas rellenas': ['60 min',
    '2 berenjenas; 300 g carne picada; 1 cebolla; 150 g tomate frito; 60 g queso rallado; 3 cdas aceite de oliva; sal',
    'Precalienta el horno a 200 °C. Parte las berenjenas por la mitad a lo largo, haz cortes en la carne y hornéalas 25 minutos.|Vacía la pulpa con una cuchara, dejando un poco pegado a la piel.|Pocha la cebolla en el aceite, añade la carne y la pulpa picada con sal, y cocina 10 minutos. Agrega el tomate.|Rellena las berenjenas, cubre con queso y gratina 10 minutos.'],
  'Espinacas a la catalana': ['20 min',
    '800 g espinacas; 40 g pasas; 30 g piñones; 2 dientes ajo; 3 cdas aceite de oliva; sal',
    'Remoja las pasas en agua templada 10 minutos.|Lava las espinacas y escáldalas 1 minuto en agua hirviendo. Escúrrelas bien.|Dora el ajo laminado y los piñones en el aceite. Añade las pasas escurridas.|Incorpora las espinacas y sal y saltea 2 minutos.'],
  'Coliflor gratinada': ['45 min',
    '1 coliflor; 500 ml leche; 40 g harina; 40 g mantequilla; 80 g queso rallado; sal',
    'Cuece la coliflor en ramilletes en agua con sal 10 minutos y escúrrela.|Para la bechamel, derrite la mantequilla, añade la harina y remueve 2 minutos. Vierte la leche poco a poco sin dejar de remover hasta que espese. Sala.|Pon la coliflor en una fuente y cúbrela con la bechamel y el queso.|Gratina en el horno a 220 °C 10–15 minutos, hasta que se dore.'],
  'Ensalada mixta': ['15 min',
    '1 lechuga; 3 tomates; 1 cebolla; 120 g atún en lata; 3 huevos; 80 g aceitunas; 4 cdas aceite de oliva; 1 cda vinagre; sal',
    'Cuece los huevos 10 minutos, enfríalos y pélalos.|Lava y corta la lechuga, el tomate y la cebolla.|Ponlo todo en una fuente con el atún escurrido, los huevos en cuartos y las aceitunas.|Aliña con aceite, vinagre y sal justo antes de servir.'],
  'Gazpacho': ['15 min (y 1 h de nevera)',
    '1000 g tomates maduros; 1 pimiento verde; 1 pepino; 1 diente ajo; 50 g pan; 80 ml aceite de oliva; 2 cdas vinagre; 200 ml agua; sal',
    'Lava y trocea los tomates, el pimiento y el pepino pelado.|Ponlo todo en la batidora con el ajo, el pan, el agua, el vinagre y sal.|Tritura bien y añade el aceite poco a poco sin dejar de triturar.|Cuélalo si lo quieres muy fino, ajusta de sal y vinagre y enfríalo al menos 1 hora.'],
  'Salmorejo': ['15 min (y 1 h de nevera)',
    '1000 g tomates maduros; 200 g pan; 1 diente ajo; 120 ml aceite de oliva; 2 huevos; 60 g jamón serrano; sal',
    'Cuece los huevos 10 minutos y pícalos.|Tritura los tomates y cuela el puré.|Añade el pan troceado y el ajo, deja que el pan se empape 10 minutos y tritura de nuevo.|Agrega el aceite poco a poco triturando hasta que quede espeso y cremoso. Sala.|Sirve frío con el huevo y el jamón picados por encima.'],
  'Alcachofas con jamón': ['40 min',
    '12 alcachofas; 100 g jamón serrano; 3 dientes ajo; 1 limón; 1 cda harina; 4 cdas aceite de oliva; sal',
    'Limpia las alcachofas quitando las hojas duras y las puntas, córtalas en cuartos y ponlas en agua con limón para que no se oscurezcan.|Cuécelas en agua con sal 15–20 minutos y escúrrelas, guardando un vaso del agua.|Dora el ajo laminado y el jamón en tacos en el aceite.|Añade la harina, remueve, vierte el agua reservada y agrega las alcachofas. Cocina 5 minutos.'],
  'Escalivada': ['60 min',
    '3 pimientos rojos; 2 berenjenas; 2 cebollas; 8 anchoas; 4 cdas aceite de oliva; sal',
    'Precalienta el horno a 200 °C.|Pon las verduras enteras en una bandeja, úntalas con un poco de aceite y hornéalas 45–50 minutos, dándoles la vuelta a mitad.|Mételas en un recipiente tapado 10 minutos para que suden y sea fácil pelarlas.|Pélalas, córtalas en tiras y alíñalas con aceite y sal. Sirve con las anchoas por encima.'],
  'Wok de verduras': ['20 min',
    '1 brócoli; 2 zanahorias; 1 pimiento rojo; 1 calabacín; 200 g champiñones; 1 diente ajo; 3 cdas salsa de soja; 3 cdas aceite de oliva',
    'Corta todas las verduras en tiras o trozos pequeños del mismo tamaño.|Calienta mucho el wok o una sartén grande con el aceite.|Saltea primero la zanahoria y el brócoli 3 minutos; luego el pimiento, el calabacín, los champiñones y el ajo, 3 minutos más, sin dejar de mover.|Añade la salsa de soja, saltea 1 minuto y sirve enseguida.'],
  'Vichyssoise': ['40 min',
    '4 puerros; 2 patatas; 1 cebolla; 200 ml nata para cocinar; 750 ml caldo de pollo; 30 g mantequilla; sal',
    'Corta la parte blanca de los puerros y la cebolla, y póchalos en la mantequilla 10 minutos sin que se doren.|Añade las patatas en trozos y el caldo, y cuece 25 minutos.|Tritura, añade la nata y vuelve a triturar.|Sirve fría o caliente.'],
  'Parrillada de verduras': ['30 min',
    '1 calabacín; 1 berenjena; 1 pimiento rojo; 1 pimiento verde; 250 g champiñones; 250 g espárragos trigueros; 1 cebolla; 5 cdas aceite de oliva; sal gruesa',
    'Corta el calabacín, la berenjena y la cebolla en rodajas, y los pimientos en tiras.|Calienta bien la plancha y pincélala con aceite.|Haz las verduras por tandas, 3–4 minutos por cada lado, empezando por las más duras.|Sirve con sal gruesa y un chorrito de aceite.'],
  'Brócoli salteado con ajo': ['15 min',
    '800 g brócoli; 4 dientes ajo; 30 g almendras; 3 cdas aceite de oliva; sal',
    'Corta el brócoli en ramilletes y cuécelo 3 minutos en agua con sal. Escúrrelo.|Dora el ajo laminado y las almendras en el aceite.|Añade el brócoli y saltea 3–4 minutos a fuego fuerte. Sala y sirve.'],
  'Puré de verduras': ['40 min',
    '3 patatas; 3 zanahorias; 1 puerro; 1 calabacín; 150 g judías verdes; 2 cdas aceite de oliva; sal',
    'Pela y trocea todas las verduras.|Pon el aceite en una olla y rehoga el puerro 5 minutos.|Añade el resto de verduras, cubre con agua, sala y cuece 25 minutos.|Tritura con parte del caldo hasta que tenga la textura que te guste.'],

  // ---------- Legumbres ----------
  'Lentejas estofadas': ['60 min',
    '400 g lentejas; 150 g chorizo; 2 patatas; 2 zanahorias; 1 cebolla; 1 pimiento verde; 2 dientes ajo; 1 hoja laurel; 1 cdta pimentón; 3 cdas aceite de oliva; sal',
    'Pica la cebolla, el pimiento y el ajo y póchalos en el aceite en una olla 10 minutos.|Añade el pimentón, remueve unos segundos y agrega las lentejas lavadas, la zanahoria y el chorizo en rodajas, y el laurel.|Cubre con agua fría (unos 1,5 l) y cuece 30 minutos a fuego suave.|Añade las patatas troceadas y sal, y cuece 20 minutos más hasta que todo esté tierno.'],
  'Garbanzos con espinacas': ['25 min',
    '800 g garbanzos cocidos; 400 g espinacas; 3 dientes ajo; 1 rebanada pan; 1 cdta pimentón; 1 cdta comino; 1 cda vinagre; 4 cdas aceite de oliva; sal',
    'Fríe en el aceite el pan y 2 dientes de ajo hasta que se doren. Machácalos con el pimentón, el comino, el vinagre y un poco de agua.|En el mismo aceite rehoga el otro ajo y las espinacas hasta que se ablanden.|Añade los garbanzos escurridos, el majado y un vaso de agua.|Cocina 10 minutos a fuego suave y prueba de sal.'],
  'Cocido madrileño': ['3 h 30 min (y remojo la noche antes)',
    '400 g garbanzos secos; 400 g morcillo de ternera; 300 g gallina; 60 g tocino; 100 g chorizo; 100 g morcilla; 1 hueso de jamón; 500 g repollo; 3 zanahorias; 4 patatas; 100 g fideos; 2 dientes ajo; 2 cdas aceite de oliva; sal',
    'La noche anterior, pon los garbanzos en remojo en agua templada con sal.|Pon en una olla grande las carnes (menos el chorizo y la morcilla), el tocino y el hueso con agua fría. Al hervir, quita la espuma y añade los garbanzos metidos en una malla.|Cuece a fuego suave 2 horas y media (o 40 minutos en olla rápida). En la última media hora añade las zanahorias y las patatas.|Cuece aparte el chorizo y la morcilla, y también el repollo; rehoga el repollo con ajo y aceite.|Cuela el caldo y cuece en él los fideos para la sopa. Sirve primero la sopa y después los garbanzos, las verduras y las carnes.'],
  'Fabada asturiana': ['3 h (y remojo la noche antes)',
    '500 g fabes; 200 g chorizo; 200 g morcilla; 150 g panceta; 200 g lacón; 1 pizca azafrán; sal',
    'La noche anterior, pon las fabes en remojo en agua fría, y el lacón en otro recipiente.|Pon las fabes en una olla con el lacón, la panceta, el chorizo y la morcilla, y cubre con agua fría.|Lleva a ebullición, quita la espuma y «asusta» las fabes con un chorrito de agua fría dos o tres veces.|Añade el azafrán y cuece a fuego muy suave 2 horas y media, sin remover (mueve la olla), hasta que estén tiernas. Sala al final.'],
  'Alubias blancas con verduras': ['90 min (y remojo la noche antes)',
    '400 g alubias blancas; 1 puerro; 2 zanahorias; 1 pimiento verde; 1 cebolla; 2 dientes ajo; 1 cdta pimentón; 4 cdas aceite de oliva; sal',
    'Pon las alubias en remojo la noche anterior.|Cuécelas en agua fría con la mitad del puerro y una zanahoria, a fuego suave 1 hora, «asustándolas» con agua fría cuando hiervan.|Mientras, pocha en el aceite la cebolla, el pimiento, el ajo y el resto del puerro y la zanahoria picados. Añade el pimentón.|Echa el sofrito a las alubias, sala y cuece 20 minutos más hasta que estén tiernas.'],
  'Potaje de vigilia': ['2 h 30 min (y remojo la noche antes)',
    '400 g garbanzos secos; 250 g bacalao desalado; 400 g espinacas; 2 huevos; 1 cebolla; 2 dientes ajo; 1 cdta pimentón; 1 hoja laurel; 4 cdas aceite de oliva; sal',
    'Pon los garbanzos en remojo la noche anterior.|Cuécelos con el laurel en agua caliente 2 horas (o 30 minutos en olla rápida).|Pocha la cebolla y el ajo en el aceite, añade el pimentón y échalo a la olla con las espinacas.|Añade el bacalao desmigado y cuece 10 minutos.|Sirve con huevo duro picado por encima.'],
  'Ensalada de garbanzos': ['15 min',
    '800 g garbanzos cocidos; 2 tomates; 1 pimiento rojo; ½ cebolla; 120 g atún en lata; 2 huevos; 4 cdas aceite de oliva; 1 cda vinagre; sal',
    'Cuece los huevos 10 minutos y pícalos.|Lava y escurre los garbanzos.|Pica el tomate, el pimiento y la cebolla en dados pequeños.|Mézclalo todo con el atún y aliña con aceite, vinagre y sal.'],
  'Hummus con verduras para mojar': ['15 min',
    '400 g garbanzos cocidos; 2 cdas tahini; 1 limón; 1 diente ajo; 1 cdta comino; 3 cdas aceite de oliva; 3 zanahorias; 1 pepino; 4 panes de pita; sal',
    'Tritura los garbanzos escurridos con el tahini, el zumo de limón, el ajo, el comino, sal y un poco de agua hasta que quede cremoso.|Pásalo a un cuenco y riégalo con el aceite.|Corta las zanahorias y el pepino en bastones.|Sirve con las verduras y el pan de pita tostado.'],
  'Lentejas con arroz': ['50 min',
    '300 g lentejas; 100 g arroz; 1 cebolla; 2 dientes ajo; 1 pimiento verde; 1 cdta pimentón; 1 hoja laurel; 3 cdas aceite de oliva; sal',
    'Pocha la cebolla, el pimiento y el ajo picados en el aceite 10 minutos. Añade el pimentón.|Agrega las lentejas lavadas, el laurel y 1,5 l de agua. Cuece 25 minutos.|Añade el arroz y sal, y cuece 15–18 minutos más, hasta que el arroz esté hecho.|Deja reposar 5 minutos antes de servir.'],
  'Alubias rojas': ['2 h (y remojo la noche antes)',
    '400 g alubias rojas; 150 g chorizo; 1 cebolla; 1 pimiento verde; 2 dientes ajo; 3 cdas aceite de oliva; sal',
    'Pon las alubias en remojo la noche anterior.|Cuécelas en agua fría con media cebolla, a fuego suave, «asustándolas» con agua fría tres veces.|Mientras, sofríe el resto de la cebolla, el pimiento y el ajo picados en el aceite.|A la hora, añade el sofrito y el chorizo en rodajas, sala y cuece 40 minutos más hasta que estén tiernas.'],
  'Ensalada de lentejas': ['15 min',
    '600 g lentejas cocidas; 2 tomates; 1 pimiento rojo; ½ cebolla; 1 pepino; 4 cdas aceite de oliva; 1 cda vinagre; sal',
    'Lava y escurre las lentejas.|Pica el tomate, el pimiento, la cebolla y el pepino en dados pequeños.|Mézclalo todo y aliña con aceite, vinagre y sal.|Déjala 15 minutos en la nevera antes de servir.'],

  // ---------- Pasta y arroz ----------
  'Paella mixta': ['60 min',
    '400 g arroz bomba; 500 g pollo troceado; 300 g gambas; 400 g mejillones; 250 g calamares; 150 g judías verdes; 2 tomates; 2 dientes ajo; 1 cdta pimentón; 1 pizca azafrán; 1200 ml caldo de pescado; 6 cdas aceite de oliva; sal',
    'En la paellera, dora el pollo salado en el aceite. Añade los calamares en anillas y las judías troceadas y rehoga 5 minutos.|Añade el ajo picado y el tomate rallado y sofríe 5 minutos. Echa el pimentón.|Agrega el arroz, remueve 1 minuto y vierte el caldo caliente con el azafrán. Prueba de sal.|Cuece 10 minutos a fuego fuerte y 8 a fuego suave, sin remover. En los últimos minutos pon las gambas y los mejillones.|Deja reposar 5 minutos tapada con un paño antes de servir.'],
  'Arroz a la cubana': ['30 min',
    '300 g arroz; 300 g tomate frito; 4 huevos; 4 plátanos; 2 dientes ajo; 60 ml aceite de oliva (lo que absorbe la fritura); sal',
    'Cuece el arroz en agua con sal 18 minutos. Escúrrelo y saltéalo con un poco de aceite y el ajo.|Calienta el tomate frito.|Fríe los plátanos partidos a lo largo y después los huevos.|Sirve el arroz con el tomate, el huevo y el plátano.'],
  'Arroz negro': ['50 min',
    '400 g arroz bomba; 600 g calamares; 2 sobres tinta de calamar; 1 cebolla; 2 dientes ajo; 1 tomate; 1200 ml caldo de pescado; 5 cdas aceite de oliva; sal',
    'Pica la cebolla y el ajo y póchalos en el aceite en la paellera 10 minutos.|Añade los calamares troceados y el tomate rallado, y cocina 5 minutos.|Agrega el arroz, remueve y vierte el caldo caliente con la tinta disuelta. Prueba de sal.|Cuece 18 minutos sin remover (10 a fuego fuerte y 8 a fuego suave) y deja reposar 5 minutos. Queda muy bien con alioli.'],
  'Arroz al horno': ['75 min',
    '400 g arroz; 400 g costillas de cerdo; 150 g morcilla; 300 g garbanzos cocidos; 2 patatas; 2 tomates; 8 dientes ajo; 1 cdta pimentón; 1 l caldo; 4 cdas aceite de oliva; sal',
    'Precalienta el horno a 220 °C.|Dora en el aceite las costillas troceadas, las patatas en rodajas, un tomate en rodajas y los ajos. Retíralos.|En el mismo aceite sofríe el otro tomate rallado y el pimentón, añade el arroz y remueve.|Pásalo todo a una cazuela de barro y coloca encima las costillas, la morcilla en trozos, las patatas, el tomate, los garbanzos y los ajos.|Cubre con el caldo hirviendo, sala y hornea 20 minutos. Deja reposar 5 minutos.'],
  'Fideuá': ['40 min',
    '400 g fideos gruesos; 400 g gambas; 300 g calamares; 1 tomate; 3 dientes ajo; 1 cdta pimentón; 1 pizca azafrán; 1 l caldo de pescado; 5 cdas aceite de oliva; sal',
    'Dora los fideos en el aceite en la paellera, moviéndolos, hasta que estén tostados. Retíralos.|Saltea las gambas y resérvalas. Sofríe los calamares troceados, el ajo picado y el tomate rallado 5 minutos.|Añade el pimentón, los fideos y el caldo caliente con el azafrán. Prueba de sal.|Cuece 10 minutos a fuego medio. Pon las gambas encima y, si quieres, gratina 2 minutos para que los fideos se levanten.'],
  'Macarrones con tomate': ['30 min',
    '400 g macarrones; 300 g tomate frito; 300 g carne picada; 100 g chorizo; 1 cebolla; 80 g queso rallado; 2 cdas aceite de oliva; sal',
    'Cuece los macarrones en agua con sal el tiempo que diga el paquete y escúrrelos.|Pocha la cebolla picada en el aceite, añade el chorizo en dados y la carne, y cocina hasta que se dore.|Añade el tomate frito y cocina 5 minutos.|Mézclalo con los macarrones, cubre con queso y gratina 10 minutos en el horno a 220 °C.'],
  'Espaguetis a la carbonara': ['20 min',
    '400 g espaguetis; 150 g bacon; 3 huevos; 80 g queso parmesano; sal; pimienta',
    'Cuece los espaguetis en agua con sal. Guarda un vaso del agua de cocción.|Dora el bacon en tiras en una sartén sin aceite.|Bate los huevos con el parmesano rallado y mucha pimienta.|Escurre la pasta y échala en la sartén con el bacon, fuera del fuego. Añade la mezcla de huevo y un poco del agua de cocción y remueve rápido para que quede cremosa sin cuajarse.'],
  'Lasaña de verduras': ['75 min',
    '200 g placas de lasaña; 1 calabacín; 1 berenjena; 200 g espinacas; 400 g tomate triturado; 1 cebolla; 500 ml leche; 40 g harina; 40 g mantequilla; 100 g queso rallado; 3 cdas aceite de oliva; sal',
    'Cuece las placas según el paquete (o usa placas precocidas).|Pocha la cebolla en el aceite, añade el calabacín y la berenjena en dados y cocina 15 minutos. Agrega las espinacas y el tomate y cocina 10 minutos más.|Haz la bechamel: derrite la mantequilla, añade la harina, remueve 2 minutos y vierte la leche poco a poco hasta que espese. Sala.|En una fuente alterna capas de placas, verduras y bechamel. Termina con bechamel y queso.|Hornea a 200 °C 25 minutos.'],
  'Canelones': ['75 min',
    '160 g placas de canelones; 500 g carne picada; 1 cebolla; 150 g tomate frito; 600 ml leche; 50 g harina; 50 g mantequilla; 80 g queso rallado; 3 cdas aceite de oliva; sal',
    'Cuece las placas según el paquete y extiéndelas sobre un paño.|Pocha la cebolla en el aceite, añade la carne y sal, y cocina 10 minutos. Mézclala con el tomate frito.|Haz la bechamel con la mantequilla, la harina y la leche, y sala. Añade un poco al relleno.|Rellena y enrolla las placas, colócalas en una fuente y cúbrelas con el resto de la bechamel y el queso.|Hornea a 200 °C 20 minutos, hasta que se doren.'],
  'Risotto de setas': ['35 min',
    '320 g arroz arborio; 300 g setas; 1 cebolla; 1 l caldo de verduras; 100 ml vino blanco; 60 g queso parmesano; 30 g mantequilla; 2 cdas aceite de oliva; sal',
    'Mantén el caldo caliente en un cazo.|Pocha la cebolla picada en el aceite. Añade las setas troceadas y saltea 5 minutos.|Echa el arroz, remueve 1 minuto y añade el vino.|Ve añadiendo el caldo cazo a cazo, removiendo, durante 18 minutos.|Apaga el fuego, añade la mantequilla y el parmesano, remueve y deja reposar 2 minutos.'],
  'Ensalada de pasta': ['20 min',
    '300 g pasta; 200 g tomates cherry; 120 g atún en lata; 140 g maíz dulce; 80 g aceitunas; 2 huevos; 4 cdas aceite de oliva; 1 cda vinagre; sal',
    'Cuece la pasta en agua con sal, escúrrela y enfríala bajo el grifo.|Cuece los huevos 10 minutos y pícalos.|Parte los tomates por la mitad.|Mézclalo todo con el atún, el maíz y las aceitunas, y aliña con aceite, vinagre y sal.'],
  'Ñoquis con salsa de tomate': ['25 min',
    '800 g ñoquis; 400 g tomate triturado; 2 dientes ajo; 10 g albahaca; 50 g queso parmesano; 3 cdas aceite de oliva; 1 cdta azúcar; sal',
    'Dora el ajo laminado en el aceite, añade el tomate, el azúcar y sal, y cocina 15 minutos.|Cuece los ñoquis en agua con sal: están listos cuando suben a la superficie.|Escúrrelos y mézclalos con la salsa y la albahaca troceada.|Sirve con parmesano rallado.'],
  'Cuscús con verduras': ['30 min',
    '300 g cuscús; 1 calabacín; 2 zanahorias; 1 pimiento rojo; 1 cebolla; 400 g garbanzos cocidos; 1 cdta comino; 400 ml caldo de verduras; 4 cdas aceite de oliva; sal',
    'Corta todas las verduras en dados pequeños.|Pocha la cebolla y la zanahoria en el aceite 8 minutos. Añade el pimiento y el calabacín y cocina 8 minutos más. Agrega los garbanzos y el comino.|Calienta el caldo, viértelo sobre el cuscús en un bol, tapa y deja 5 minutos.|Suelta el cuscús con un tenedor y mézclalo con las verduras.'],
  'Arroz con verduras': ['45 min',
    '400 g arroz; 1 pimiento rojo; 200 g judías verdes; 4 alcachofas; 1 tomate; 150 g guisantes; 1 cdta pimentón; 1 pizca azafrán; 1200 ml caldo de verduras; 6 cdas aceite de oliva; sal',
    'Sofríe en el aceite el pimiento en tiras, las judías troceadas y las alcachofas en cuartos 8 minutos.|Añade el tomate rallado y el pimentón y cocina 3 minutos.|Agrega el arroz, remueve y vierte el caldo caliente con el azafrán y los guisantes. Prueba de sal.|Cuece 18 minutos sin remover y deja reposar 5 minutos.'],

  // ---------- Huevos ----------
  'Tortilla de patatas': ['45 min',
    '8 huevos; 800 g patatas; 1 cebolla; 80 ml aceite de oliva (lo que absorben las patatas); sal',
    'Pela las patatas, córtalas en láminas finas y la cebolla en juliana. Sala.|Confítalas a fuego medio en abundante aceite unos 20 minutos, hasta que estén tiernas. Escúrrelas bien.|Bate los huevos con sal y mézclalos con las patatas. Deja reposar 5 minutos.|Cuaja la mezcla en una sartén con unas gotas de aceite a fuego medio 3–4 minutos. Dale la vuelta con un plato y cuaja 2 minutos más.'],
  'Huevos rotos con jamón': ['30 min',
    '8 huevos; 800 g patatas; 120 g jamón serrano; 80 ml aceite de oliva (lo que absorbe la fritura); sal',
    'Corta las patatas en bastones o rodajas y fríelas hasta que estén doradas. Sálalas.|Fríe los huevos en aceite bien caliente, dejando la yema líquida.|Pon las patatas en una fuente, los huevos encima y el jamón.|Rompe los huevos sobre las patatas justo antes de comer.'],
  'Revuelto de setas': ['15 min',
    '6 huevos; 400 g setas; 2 dientes ajo; 10 g perejil; 3 cdas aceite de oliva; sal',
    'Limpia las setas y trocéalas.|Dora el ajo laminado en el aceite, añade las setas y saltea 5 minutos. Sala.|Baja el fuego, añade los huevos batidos con sal y remueve suavemente hasta que cuajen pero queden jugosos.|Termina con perejil picado.'],
  'Tortilla francesa con ensalada': ['15 min',
    '8 huevos; 1 lechuga; 2 tomates; 4 cdas aceite de oliva; 1 cda vinagre; sal',
    'Prepara la ensalada con la lechuga y el tomate y alíñala con aceite, vinagre y sal.|Bate 2 huevos por persona con una pizca de sal.|Cuaja cada tortilla en una sartén pequeña con unas gotas de aceite, doblándola cuando aún esté jugosa por dentro.|Sirve con la ensalada.'],
  'Huevos a la flamenca': ['35 min',
    '8 huevos; 400 g tomate frito; 150 g guisantes; 100 g chorizo; 80 g jamón serrano; 1 cebolla; 2 cdas aceite de oliva; sal',
    'Precalienta el horno a 200 °C.|Pocha la cebolla en el aceite, añade el chorizo y el jamón en tacos y los guisantes, y cocina 5 minutos. Agrega el tomate.|Reparte la salsa en cazuelitas de barro y casca dos huevos en cada una.|Hornea 8–10 minutos, hasta que la clara cuaje y la yema siga líquida.'],
  'Tortilla de calabacín': ['30 min',
    '8 huevos; 2 calabacines; 1 cebolla; 4 cdas aceite de oliva; sal',
    'Corta el calabacín en dados y la cebolla en juliana.|Pocha la cebolla en el aceite 8 minutos y añade el calabacín. Cocina 10 minutos más, hasta que esté tierno. Sala.|Bate los huevos con sal y mézclalos con las verduras escurridas.|Cuaja la tortilla por los dos lados en una sartén con unas gotas de aceite.'],
  'Huevos rellenos': ['25 min',
    '8 huevos; 120 g atún en lata; 4 cdas mayonesa; 40 g aceitunas; sal',
    'Cuece los huevos 10 minutos, enfríalos en agua fría y pélalos.|Pártelos por la mitad a lo largo y saca las yemas.|Mezcla la mitad de las yemas con el atún, las aceitunas picadas y la mitad de la mayonesa.|Rellena las claras, cubre con el resto de la mayonesa y ralla por encima las yemas que sobran.'],
  'Shakshuka': ['30 min',
    '8 huevos; 800 g tomate triturado; 1 pimiento rojo; 1 cebolla; 2 dientes ajo; 1 cdta comino; 1 cdta pimentón; 3 cdas aceite de oliva; 10 g perejil; 4 rebanadas pan; sal',
    'Pocha la cebolla, el pimiento y el ajo picados en el aceite 10 minutos.|Añade el comino, el pimentón, el tomate y sal, y cocina 10 minutos hasta que espese.|Haz huecos en la salsa y casca los huevos dentro.|Tapa y cocina a fuego suave 6–8 minutos, hasta que cuaje la clara. Sirve con perejil y pan para mojar.'],
  'Revuelto de espárragos trigueros': ['15 min',
    '6 huevos; 400 g espárragos trigueros; 2 dientes ajo; 3 cdas aceite de oliva; sal',
    'Quita la parte dura de los espárragos y córtalos en trozos.|Saltéalos en el aceite con el ajo laminado 5–6 minutos. Sala.|Añade los huevos batidos con sal y remueve a fuego suave hasta que cuajen pero queden jugosos.'],
  'Frittata de verduras': ['30 min',
    '8 huevos; 1 calabacín; 1 pimiento rojo; 1 cebolla; 80 g queso rallado; 3 cdas aceite de oliva; sal',
    'Precalienta el horno a 180 °C.|Pocha la cebolla, el pimiento y el calabacín en dados en el aceite 12 minutos, en una sartén que pueda ir al horno.|Bate los huevos con el queso y sal y viértelos sobre las verduras.|Cuaja 3 minutos al fuego y termina 10 minutos en el horno.'],

  // ---------- Otros ----------
  'Pizza casera': ['30 min',
    '400 g masa de pizza; 150 g tomate frito; 250 g mozzarella; 150 g jamón york; 150 g champiñones; 1 cda aceite de oliva; 1 cdta orégano',
    'Precalienta el horno a 250 °C (o al máximo).|Estira la masa sobre papel de horno en una bandeja.|Extiende el tomate y reparte la mozzarella, el jamón y los champiñones laminados.|Riega con el aceite, echa orégano y hornea 10–12 minutos, hasta que los bordes estén dorados.'],
  'Croquetas caseras': ['90 min (y 4 h de nevera)',
    '150 g jamón serrano; 750 ml leche; 90 g harina; 80 g mantequilla; 2 huevos; 120 g pan rallado; 80 ml aceite de oliva (lo que absorbe la fritura); sal',
    'Derrite la mantequilla, añade el jamón picado y la harina y remueve 3 minutos.|Vierte la leche caliente poco a poco sin dejar de remover, unos 15 minutos, hasta tener una masa espesa que se despegue de la sartén. Prueba de sal.|Extiéndela en una fuente, tápala con film en contacto y déjala enfriar en la nevera al menos 4 horas.|Forma las croquetas y pásalas por huevo batido y pan rallado.|Fríelas en aceite abundante muy caliente, pocas a la vez, hasta que estén doradas.'],
  'Empanada gallega': ['75 min',
    '500 g masa de empanada; 240 g atún en lata; 2 cebollas; 1 pimiento rojo; 200 g tomate frito; 2 huevos; 3 cdas aceite de oliva; sal',
    'Precalienta el horno a 190 °C. Cuece un huevo 10 minutos.|Pocha la cebolla y el pimiento en tiras en el aceite 20 minutos. Añade el tomate, el atún desmigado y el huevo duro picado.|Extiende una lámina de masa en la bandeja, reparte el relleno frío y cubre con la otra lámina. Cierra los bordes.|Haz un agujero en el centro, pinta con el otro huevo batido y hornea 35–40 minutos.'],
  'Crepes salados': ['30 min',
    '125 g harina; 2 huevos; 300 ml leche; 20 g mantequilla; 150 g jamón york; 150 g queso; sal',
    'Bate la harina, los huevos, la leche, la mantequilla derretida y una pizca de sal hasta que no queden grumos. Deja reposar 15 minutos.|Calienta una sartén antiadherente con una gota de mantequilla y echa un cazo pequeño de masa, moviendo la sartén para que cubra el fondo.|Cuando se despegue, dale la vuelta y cuécela 30 segundos más.|Rellena cada crepe con jamón y queso, dóblala y caliéntala 1 minuto para que se funda el queso.'],
  'Sopa de picadillo': ['20 min',
    '1500 ml caldo de cocido; 80 g fideos; 2 huevos; 80 g jamón serrano; hierbabuena',
    'Cuece los huevos 10 minutos y pícalos.|Calienta el caldo y, cuando hierva, añade los fideos. Cuécelos 5 minutos.|Añade el jamón y el huevo picados.|Sirve con unas hojas de hierbabuena.'],
  'Patatas a la riojana': ['50 min',
    '1000 g patatas; 200 g chorizo; 1 cebolla; 1 pimiento verde; 2 dientes ajo; 1 cdta pimentón; 1 hoja laurel; 3 cdas aceite de oliva; sal',
    'Pocha la cebolla, el pimiento y el ajo picados en el aceite 10 minutos.|Añade el chorizo en rodajas y rehoga 2 minutos. Echa el pimentón.|Agrega las patatas «cascadas» (rompiendo el último corte), rehoga y cubre con agua. Añade el laurel y sal.|Cuece 25–30 minutos a fuego suave, hasta que las patatas estén tiernas y el caldo espese.'],
  'Sopa de cebolla': ['60 min',
    '6 cebollas; 1200 ml caldo de carne; 40 g mantequilla; 1 cda harina; 100 ml vino blanco; 4 rebanadas pan; 100 g queso rallado; sal',
    'Corta las cebollas en juliana fina y póchalas en la mantequilla a fuego lento 30 minutos, hasta que estén doradas.|Añade la harina, remueve y vierte el vino. Deja que reduzca.|Agrega el caldo y cuece 15 minutos. Prueba de sal.|Reparte en cuencos que puedan ir al horno, pon encima el pan tostado y el queso, y gratina hasta que se dore.'],
  'Tostas variadas': ['15 min',
    '8 rebanadas pan de pueblo; 2 tomates; 100 g jamón serrano; 150 g queso; 1 aguacate; 3 cdas aceite de oliva; sal',
    'Tuesta el pan.|Ralla los tomates y alíñalos con aceite y sal.|Unta unas tostas con tomate y pon jamón; otras con queso; y otras con aguacate machacado con sal.|Termina con un chorrito de aceite.'],
  'Quiche de verduras': ['60 min',
    '250 g masa quebrada; 4 huevos; 200 ml nata para cocinar; 1 puerro; 200 g espinacas; 100 g queso rallado; 2 cdas aceite de oliva; sal',
    'Precalienta el horno a 190 °C. Forra un molde con la masa, pínchala con un tenedor y hornéala 10 minutos.|Pocha el puerro en el aceite 8 minutos y añade las espinacas hasta que se ablanden.|Bate los huevos con la nata, el queso y sal, y mézclalo con las verduras.|Vierte el relleno sobre la masa y hornea 30 minutos, hasta que cuaje.'],
  // ---------- Platos de casa que no están entre las ideas ----------
  'Huevos fritos y patatas con jamón': ['30 min',
    '8 huevos; 800 g patatas; 120 g jamón serrano; 100 ml aceite de oliva (lo que absorbe la fritura); sal',
    'Pela las patatas y córtalas en bastones. Lávalas y sécalas bien.|Fríelas en abundante aceite a fuego medio 10 minutos y luego sube el fuego 2–3 minutos para que se doren. Escúrrelas y sálalas.|Pasa el jamón en tiras unos segundos por ese aceite, o déjalo crudo, al gusto.|Fríe los huevos de uno en uno en aceite muy caliente, echándoles aceite por encima con la espumadera para que la clara quede con puntilla y la yema líquida.|Sirve dos huevos por persona con las patatas y el jamón.'],
  'Bogavante': ['25 min',
    '1200 g bogavante; 4 dientes ajo; 15 g perejil; 4 cdas aceite de oliva; 1 limón; sal gruesa',
    'Si el bogavante está vivo, mételo 15 minutos en el congelador para adormecerlo.|Pártelo por la mitad a lo largo con un cuchillo grande y casca un poco las pinzas.|Pica el ajo y el perejil y mézclalos con el aceite.|Pon los bogavantes en la plancha muy caliente con la carne hacia abajo 4–5 minutos. Dales la vuelta, píntalos con el aceite de ajo y perejil y hazlos 4–5 minutos más. Las pinzas necesitan 8–10 minutos.|Sirve con sal gruesa y limón.'],
  'Caviar': ['20 min',
    '50 g caviar; 6 rebanadas pan de molde; 100 ml nata; 2 huevos; ½ cebolla; 1 limón',
    'Guarda el caviar en la nevera hasta el último momento y sírvelo sobre hielo, con una cucharilla que no sea de metal (de nácar, hueso o plástico).|Tuesta el pan, quítale la corteza y córtalo en triángulos pequeños.|Cuece los huevos 10 minutos, enfríalos y pica por separado la clara y la yema. Pica la cebolla muy fina.|Sirve el caviar en su lata con las tostas, la nata, el huevo, la cebolla y el limón, para que cada uno se prepare la suya.'],

  'Sándwiches calientes': ['15 min',
    '8 rebanadas pan de molde; 8 lonchas jamón york; 8 lonchas queso; 2 tomates; 20 g mantequilla',
    'Unta una cara de cada rebanada con un poco de mantequilla.|Monta los sándwiches con la mantequilla por fuera: jamón, queso y unas rodajas finas de tomate.|Tuéstalos en una sartén a fuego medio 2–3 minutos por cada lado, apretando un poco, hasta que el queso se funda.'],
};

// ---------- Leer ingredientes y calcular calorías ----------

let foodIndex = null;
const singular = (w) => (/[nlrj]es$/.test(w) ? w.slice(0, -2) : /s$/.test(w) && w.length > 3 ? w.slice(0, -1) : w);
// «Pimientos Rojos (de bote)» → «pimiento rojo de bote»
const foodWords = (s) => norm(s).replace(/[^a-z0-9ñ ]+/g, ' ').split(' ').filter(Boolean).map(singular).join(' ');

function foods() {
  if (foodIndex) return foodIndex;
  foodIndex = ALIMENTOS_TXT.trim().split('\n').map((line) => {
    const [name, kcal, p, g, h, ...extra] = line.split('|');
    const f = { key: foodWords(name), kcal: +kcal, p: +p, g: +g, h: +h };
    for (const e of extra) f[e[0]] = parseFloat(e.slice(1));
    return f;
  }).sort((a, b) => b.key.length - a.key.length);   // gana el nombre más largo: «caldo de pollo» antes que «pollo»
  return foodIndex;
}

function findFood(name) {
  const text = ` ${foodWords(name)} `;
  return foods().find((f) => text.includes(` ${f.key} `)) || null;
}

const UNIDADES = {
  g: ['g', 'gr', 'grs', 'gramo', 'gramos'], kg: ['kg', 'kilo', 'kilos'], ml: ['ml'], cl: ['cl'], l: ['l', 'litro', 'litros'],
  cda: ['cda', 'cdas', 'cucharada', 'cucharadas'], cdta: ['cdta', 'cdtas', 'cucharadita', 'cucharaditas'],
  diente: ['diente', 'dientes'], lata: ['lata', 'latas', 'bote', 'botes'], vaso: ['vaso', 'vasos'], taza: ['taza', 'tazas'],
  pizca: ['pizca', 'pizcas'], chorrito: ['chorrito', 'chorritos', 'chorro', 'chorros'], rama: ['rama', 'ramas', 'ramita', 'ramitas'],
  hoja: ['hoja', 'hojas'], manojo: ['manojo', 'manojos'], punado: ['puñado', 'puñados', 'punado', 'punados'],
  loncha: ['loncha', 'lonchas'], rebanada: ['rebanada', 'rebanadas'], sobre: ['sobre', 'sobres'],
  ud: ['ud', 'uds', 'unidad', 'unidades', 'pieza', 'piezas'],
};
const UNIT_OF = Object.fromEntries(Object.entries(UNIDADES).flatMap(([k, list]) => list.map((w) => [w, k])));
const UNIT_RE = Object.values(UNIDADES).flat().sort((a, b) => b.length - a.length).join('|');
const LINE_RE = new RegExp(`^(\\d+(?:[.,]\\d+)?(?:\\s*\\/\\s*\\d+)?|[½¼¾]|(?:medio|media|una|uno|un)(?=\\s))\\s*(?:(${UNIT_RE})\\.?(?=\\s))?\\s*(?:de\\s+)?(.+)$`, 'i');
const LABEL = {
  g: ['g', 'g'], kg: ['kg', 'kg'], ml: ['ml', 'ml'], cl: ['cl', 'cl'], l: ['l', 'l'], cda: ['cda', 'cdas'], cdta: ['cdta', 'cdtas'],
  diente: ['diente', 'dientes'], lata: ['lata', 'latas'], vaso: ['vaso', 'vasos'], taza: ['taza', 'tazas'], pizca: ['pizca', 'pizcas'],
  chorrito: ['chorrito', 'chorritos'], rama: ['rama', 'ramas'], hoja: ['hoja', 'hojas'], manojo: ['manojo', 'manojos'],
  punado: ['puñado', 'puñados'], loncha: ['loncha', 'lonchas'], rebanada: ['rebanada', 'rebanadas'], sobre: ['sobre', 'sobres'], ud: ['ud', 'ud'],
};

function readQty(q) {
  q = q.toLowerCase().replace(',', '.');
  if (q === '½' || q === 'medio' || q === 'media') return 0.5;
  if (q === '¼') return 0.25;
  if (q === '¾') return 0.75;
  if (q === 'un' || q === 'una' || q === 'uno') return 1;
  if (q.includes('/')) { const [a, b] = q.split('/').map(Number); return b ? a / b : a; }
  return parseFloat(q);
}

// «800 g merluza en rodajas» → { qty: 800, unit: 'g', name: 'merluza en rodajas', food, grams }
function parseIngredient(line) {
  const text = line.trim().replace(/\s+/g, ' ');
  const m = text.match(LINE_RE);
  const r = m ? { qty: readQty(m[1]), unit: m[2] ? UNIT_OF[m[2].toLowerCase()] : null, name: m[3] } : { qty: null, unit: null, name: text };
  r.name = r.name.trim();
  r.food = findFood(r.name);
  r.grams = gramsOf(r);
  return r;
}

function gramsOf({ qty, unit, food }) {
  if (qty == null || !food) return null;
  const d = food.d || 1;
  const c = food.c || 15;
  switch (unit) {
    case 'g': return qty;
    case 'kg': return qty * 1000;
    case 'ml': return qty * d;
    case 'cl': return qty * 10 * d;
    case 'l': return qty * 1000 * d;
    case 'cda': return qty * c;
    case 'cdta': return qty * c / 3;
    case 'diente': return qty * (food.u || 5);
    case 'lata': return food.l ? qty * food.l : null;
    case 'vaso': return qty * 200 * d;
    case 'taza': return qty * 240 * d;
    case 'chorrito': return qty * 10 * d;
    case 'pizca': return qty * 0.5;
    case 'rama': return qty * 2;
    case 'hoja': return qty * (food.u && food.u < 5 ? food.u : 10);
    case 'manojo': case 'punado': return qty * 30;
    case 'loncha': return qty * (food.u && food.u <= 30 ? food.u : 15);
    case 'rebanada': return qty * (food.u && food.u <= 60 ? food.u : 30);
    case 'sobre': return qty * (food.u || 5);
    default: return food.u ? qty * food.u : null;   // «2 cebollas», «4 huevos»
  }
}

const roundNice = (n) => (n >= 100 ? Math.round(n / 10) * 10 : n >= 10 ? Math.round(n / 5) * 5 : Math.round(n * 10) / 10);
function fmtNum(n) {
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  if (Math.abs(frac - 0.5) < 0.13) return whole ? `${whole}½` : '½';
  if (Math.abs(frac - 0.25) < 0.08) return whole ? `${whole}¼` : '¼';
  if (Math.abs(frac - 0.75) < 0.08) return whole ? `${whole}¾` : '¾';
  return String(Math.round(n * 10) / 10).replace('.', ',');
}

function fmtQty(r, factor) {
  if (r.qty == null) return 'al gusto';
  const q = r.qty * factor;
  const weight = ['g', 'ml', 'kg', 'l', 'cl'].includes(r.unit);
  let n = weight ? roundNice(q) : Math.max(0.25, Math.round(q * 4) / 4);
  let unit = r.unit || 'ud';
  if (unit === 'g' && n >= 1000) { n = Math.round(n / 100) / 10; unit = 'kg'; }
  if (unit === 'ml' && n >= 1000) { n = Math.round(n / 100) / 10; unit = 'l'; }
  const [one, many] = LABEL[unit];
  return `${weight ? String(n).replace('.', ',') : fmtNum(n)} ${n > 1 ? many : one}`;
}

// Quita lo que va entre paréntesis para mostrar el nombre limpio
const cleanName = (s) => cap(s.replace(/\s*\([^)]*\)/g, '').trim());

// ---------- Dónde está la receta de cada plato ----------

function catalogRecipe(name) {
  const key = norm(name);
  const entry = Object.entries(RECETAS).find(([k]) => norm(k) === key);
  if (!entry) return null;
  const [tiempo, ing, pasos] = entry[1];
  return { personas: 4, tiempo, ing: ing.split(/\s*;\s*/), pasos: pasos.split('|') };
}

function recipeFor(name) {
  const dish = state.dishes.find((d) => norm(d.name) === norm(name));
  if (dish?.recipe?.ing?.length) return { ...dish.recipe, mine: true };
  const r = catalogRecipe(name);
  return r ? { ...r, mine: false } : null;
}

// Nombres para la lista de la compra (sin sal, agua, pimienta ni aceite, que siempre hay)
const BASICOS = ['sal', 'agua', 'pimienta', 'aceite', 'aceite de oliva'];
function recipeShoppingNames(recipe) {
  return recipe.ing.map(parseIngredient)
    .filter((r) => r.qty != null && !(r.food && BASICOS.includes(r.food.key)))
    .map((r) => cleanName(r.name));
}

function nutrition(recipe, personas) {
  const factor = personas / (recipe.personas || 4);
  const rows = recipe.ing.map((line) => {
    const r = parseIngredient(line);
    const g = r.grams == null ? null : r.grams * factor;
    const kcal = g == null || !r.food ? null : (g * r.food.kcal) / 100;
    return { ...r, qtyText: fmtQty(r, factor), g, kcal };
  });
  const sum = (k) => rows.reduce((t, r) => t + (r.g == null || !r.food ? 0 : (r.g * r.food[k]) / 100), 0);
  return {
    rows,
    total: rows.reduce((t, r) => t + (r.kcal || 0), 0),
    p: sum('p'), g: sum('g'), h: sum('h'),
    unknown: rows.filter((r) => r.qty != null && r.kcal == null).map((r) => cleanName(r.name)),
  };
}

// ---------- Pantallas ----------

// La receta del catálogo que más se parece por nombre (para empezar la de un plato propio)
const VACIAS = new Set(['de', 'del', 'con', 'a', 'al', 'la', 'el', 'las', 'los', 'en', 'y', 'mi', 'casera', 'casero', 'abuela', 'mama']);
function similarRecipe(name) {
  const words = foodWords(name).split(' ').filter((w) => !VACIAS.has(w));
  let best = null, bestScore = 0;
  for (const k of Object.keys(RECETAS)) {
    const kw = new Set(foodWords(k).split(' '));
    const score = words.filter((w) => kw.has(w)).length + (kw.has(words[0]) ? 0.5 : 0);
    if (score > bestScore || (score === bestScore && best && k.length < best.length)) { best = k; bestScore = score; }
  }
  return bestScore >= 1 ? best : null;
}

// opts: { dish (plato del menú: dice quién come), onChange (al cambiar quién come), back (volver a la hoja anterior) }
function openRecipe(name, opts = {}) {
  const dish = state.dishes.find((d) => norm(d.name) === norm(name));
  const recipe = recipeFor(name);
  const cat = dish?.cat || opts.dish?.cat || CATALOGO.find((c) => norm(c[0]) === norm(name))?.[1] || 'otros';
  const back = opts.back ? '<button type="button" class="close" id="rc-back" aria-label="Volver">‹</button>' : '';
  const head = `<div class="sheet-head">${back}<h3>${esc(dish?.name || name)}</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>`;
  const bindBack = () => $('#rc-back')?.addEventListener('click', opts.back);

  if (!recipe) {
    const base = similarRecipe(name);
    openSheet(`${head}
      <div class="notice">
        <p><strong>Este plato todavía no tiene receta.</strong></p>
        <p class="small">Escríbela una vez, con las cantidades para 4 personas, y la app calculará las calorías y ajustará las cantidades a quien coma.</p>
        ${dish && base ? `<button type="button" class="btn primary" id="rc-base">📋 Empezar con la de «${esc(base)}»</button>` : ''}
        ${dish ? `<button type="button" class="btn ${base ? '' : 'primary'}" id="rc-write">✍️ Escribirla desde cero</button>` : ''}
      </div>
      ${dish ? '<button type="button" class="btn" id="rc-dish">Editar el plato</button>' : ''}
    `);
    bindBack();
    $('#rc-base')?.addEventListener('click', () => openRecipeEditor(dish.id, base));
    $('#rc-write')?.addEventListener('click', () => openRecipeEditor(dish.id, null, true));
    $('#rc-dish')?.addEventListener('click', () => openDish(dish.id));
    return;
  }

  // Quién come: el plato del menú, o una elección temporal (todos, o las personas de la receta si no hay familia)
  const who = opts.dish || (opts.who ||= (state.members || []).length ? {} : { n: recipe.personas || 4 });
  const { people, extra, raciones } = dinersOf(who);
  const nut = nutrition(recipe, Math.max(raciones, 0.01));
  const porRacion = nut.total / Math.max(raciones, 0.01);
  const members = state.members || [];
  openSheet(`${head}
    <div class="recipe-meta c-${cat}">
      <span class="dot"></span>${esc(CAT[cat]?.nombre || '')}
      ${recipe.tiempo ? `<span>⏱ ${esc(recipe.tiempo)}</span>` : ''}
      <span>🔥 ${Math.round(porRacion)} kcal por ración</span>
    </div>
    <p class="muted small">Receta base para ${recipe.personas || 4} personas. ${members.length ? 'Elige quién come y las cantidades se ajustan a la ración de cada uno.' : 'Cambia el número de personas y se ajustan las cantidades.'}</p>
    ${whoPicker(who, 'rw')}
    ${members.length ? `<div class="per-person">${people.map(({ m, f }) => `<span>${avatarOf(m)} ${esc(m.name)} <strong>${fmtInt(porRacion * f)} kcal</strong> <span class="muted">(${fmtFactor(f)})</span></span>`).join('')}${extra ? `<span>🙂 ${extra} ${extra === 1 ? 'invitado' : 'invitados'} <strong>${fmtInt(porRacion)} kcal</strong> <span class="muted">cada uno</span></span>` : ''}</div>` : ''}
    ${raciones > 0 ? `
    <table class="ing-table">
      <thead><tr><th>Ingrediente</th><th>Cantidad</th><th>kcal</th></tr></thead>
      <tbody>${nut.rows.map((r) => `<tr>
        <td>${esc(cleanName(r.name))}</td>
        <td>${esc(r.qtyText)}</td>
        <td>${r.qty == null ? '' : r.kcal == null ? '?' : Math.round(r.kcal)}</td>
      </tr>`).join('')}</tbody>
      <tfoot>
        <tr><td>Total</td><td>${fmtNum(raciones)} raciones</td><td>${Math.round(nut.total)}</td></tr>
        <tr><td>Por ración</td><td></td><td>${Math.round(porRacion)}</td></tr>
      </tfoot>
    </table>
    <div class="macros">
      <div><strong>${Math.round(nut.p / raciones)} g</strong><span>proteínas</span></div>
      <div><strong>${Math.round(nut.g / raciones)} g</strong><span>grasas</span></div>
      <div><strong>${Math.round(nut.h / raciones)} g</strong><span>hidratos</span></div>
    </div>
    <p class="muted small">Por ración estándar. Calorías aproximadas, calculadas con los ingredientes tal como se compran.${nut.unknown.length ? ` No sé las calorías de: ${esc(nut.unknown.join(', '))}.` : ''}</p>` : '<p class="muted">No come nadie: elige a alguien.</p>'}
    <h4 class="steps-title">Preparación</h4>
    <ol class="steps">${recipe.pasos.filter(Boolean).map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
    ${recipe.mine ? '<p class="muted small">Esta es vuestra receta.</p>' : ''}
    <div class="row">
      ${dish ? `<button type="button" class="btn grow" id="rc-edit">✏️ ${recipe.mine ? 'Cambiar la receta' : 'Hacerla a nuestra manera'}</button>` : ''}
      ${dish ? '<button type="button" class="btn grow" id="rc-dish">Editar el plato</button>' : ''}
    </div>
  `);
  bindBack();
  bindWho($('#sheet'), who, 'rw', () => { opts.onChange?.(); openRecipe(name, opts); });
  $('#rc-edit')?.addEventListener('click', () => openRecipeEditor(dish.id));
  $('#rc-dish')?.addEventListener('click', () => openDish(dish.id));
}

function openRecipeEditor(id, baseName, blank) {
  const dish = state.dishes.find((d) => d.id === id);
  if (!dish) return;
  const empty = { personas: 4, tiempo: '', ing: [], pasos: [] };
  const base = dish.recipe || (blank ? empty : catalogRecipe(baseName || dish.name)) || empty;
  const original = catalogRecipe(dish.name);
  openSheet(`
    <div class="sheet-head"><h3>Receta: ${esc(dish.name)}</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
    <div class="row">
      <label class="field grow">Personas<input type="number" id="re-pers" min="1" max="20" value="${base.personas || 4}" inputmode="numeric"></label>
      <label class="field grow">Tiempo<input type="text" id="re-time" value="${esc(base.tiempo || '')}" placeholder="Ej.: 45 min"></label>
    </div>
    <label class="field">Ingredientes, uno por línea, con su cantidad
      <textarea id="re-ing" placeholder="400 g lentejas&#10;2 zanahorias&#10;1 cebolla&#10;3 dientes ajo&#10;2 cdas aceite de oliva&#10;sal">${esc(base.ing.join('\n'))}</textarea>
    </label>
    <p class="muted small">Así entiende las cantidades: «400 g», «1 l», «2 cdas», «1 cdta», «3 dientes», «2 cebollas», «1 lata», «sal» (sin cantidad = al gusto).</p>
    <label class="field">Preparación, un paso por línea
      <textarea id="re-steps" placeholder="Pocha la cebolla…&#10;Añade las lentejas…">${esc(base.pasos.join('\n'))}</textarea>
    </label>
    <div class="row">
      <button type="button" class="btn primary grow" id="re-ok">Guardar receta</button>
      ${dish.recipe ? `<button type="button" class="btn danger" id="re-del">${original ? 'Volver a la original' : 'Borrar receta'}</button>` : ''}
    </div>
  `);
  const lines = (t) => t.split('\n').map((l) => l.replace(/^\s*(\d+[.)-]|[-•*·])\s*/, '').trim()).filter(Boolean);
  $('#re-ok').onclick = () => {
    const ing = lines($('#re-ing').value);
    if (!ing.length) { toast('Escribe al menos un ingrediente'); return; }
    dish.recipe = {
      personas: Math.min(20, Math.max(1, parseInt($('#re-pers').value, 10) || 4)),
      tiempo: $('#re-time').value.trim(),
      ing,
      pasos: lines($('#re-steps').value),
    };
    save();
    openRecipe(dish.name);
    toast('Receta guardada');
  };
  $('#re-del')?.addEventListener('click', () => {
    if (!confirm(original ? '¿Volver a la receta original?' : '¿Borrar la receta?')) return;
    delete dish.recipe;
    save();
    openRecipe(dish.name);
  });
}
