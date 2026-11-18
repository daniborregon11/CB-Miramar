// Constantes compartidas (copiadas del prototipo sin cambios)
export var POS = ["Base","Escolta","Alero","Ala-pívot","Pívot"];
export var QL = ["1C","2C","3C","4C","PR"];
export var TABS = ["partido","jugadores","historial","estadisticas"];
export var ACT = {
  "2A":{t:"Tiro de 2 anotado",big:"2 PT",sm:"Anotado",cls:"ok",pts:2},
  "3A":{t:"Triple anotado",big:"3 PT",sm:"Anotado",cls:"ok",pts:3},
  "1A":{t:"Tiro libre anotado",big:"TL",sm:"Anotado",cls:"ok",pts:1},
  "2F":{t:"Tiro de 2 fallado",big:"2 PT",sm:"Fallado",cls:"miss"},
  "3F":{t:"Triple fallado",big:"3 PT",sm:"Fallado",cls:"miss"},
  "1F":{t:"Tiro libre fallado",big:"TL",sm:"Fallado",cls:"miss"},
  "RD":{t:"Rebote defensivo",o:"Rebote<br>def."},
  "RO":{t:"Rebote ofensivo",o:"Rebote<br>of."},
  "AS":{t:"Asistencia",o:"Asist."},
  "RB":{t:"Robo",o:"Robo"},
  "TP":{t:"Tapón",o:"Tapón"},
  "PE":{t:"Pérdida",o:"Pérdida",cls:"neg"},
  "FC":{t:"Falta personal",o:"Falta",cls:"neg"},
  "FR":{t:"Falta recibida",o:"Falta<br>recibida"}
};
export var TITLES = {PTS:"Puntos",T2:"Tiros de 2 (anotados/intentados)",T3:"Triples (anotados/intentados)",TL:"Tiros libres (anotados/intentados)",RO:"Rebotes ofensivos",RD:"Rebotes defensivos",REB:"Rebotes totales",AS:"Asistencias",RB:"Robos",TP:"Tapones",PE:"Pérdidas",FC:"Faltas cometidas",FR:"Faltas recibidas",VAL:"Valoración",PJ:"Partidos jugados"};
