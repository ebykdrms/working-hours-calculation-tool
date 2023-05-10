import { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import "./App.css";

const Types = {
  Normal: 1, // Normal gün 09.00 - 18.00
  "Yarım Gün": 2, // Yarım gün 09.00 - 13.30
  "Mesai Dışı": 3, // Tatil günü,
  "Ara Verme": 4, // Ara verme süreleri
};

function App() {
  const [data, setData] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  const save = () => {
    if (localStorage.getItem("data")) {
      if (
        !window.confirm(
          "Tarayıcınızda daha önceden kaydedilmiş olan verilerin üzerine yazılacak..."
        )
      ) {
        alert("Kayıt iptal edildi.");
      }
    }
    localStorage.setItem("data", JSON.stringify(data));
    localStorage.setItem("selectedPersonId", selectedPersonId);
    alert("Tarayıcıya kaydedildi.");
  };

  const load = () => {
    let newData = localStorage.getItem("data");
    let newSelectedPersonId = localStorage.getItem("selectedPersonId");
    if (!newData) {
      alert("Tarayıcıda kayıt bulunamadı.");
      return;
    }
    newData = JSON.parse(newData);
    if (newSelectedPersonId === "null") newSelectedPersonId = null;
    setData(newData);
    setSelectedPersonId(newSelectedPersonId);
    alert("Kayıt yüklendi.");
  };

  const selectedPersonName = useMemo(() => {
    const name =
      data.find((person) => person.id === selectedPersonId)?.name ?? null;
    if (name === "") return null;
    return name;
  }, [data, selectedPersonId]);

  const selectedPersonDates = useMemo(() => {
    if (!selectedPersonId) return [];
    return data.find((person) => person.id === selectedPersonId)?.dates ?? [];
  }, [data, selectedPersonId]);

  const insertPerson = () => {
    const newId = uuid();
    setData([{ id: newId, name: "", dates: [] }, ...data]);
    setSelectedPersonId(newId);
  };

  const onPersonNameChange = (e, id) => {
    const value = e.target.value;
    const newData = JSON.parse(JSON.stringify(data));
    const person = newData.find((person) => person.id === id);
    person.name = value;
    setData(newData);
  };

  const deletePerson = (id) => {
    if (id === selectedPersonId) {
      setSelectedPersonId(null);
    }
    setData(data.filter((person) => person.id !== id));
  };

  useEffect(() => {
    console.log({ data, selectedPersonId });
  }, [data, selectedPersonId]);

  const insertDate = () => {
    if (!selectedPersonId) {
      alert("Önce kişi seçilmeli!");
      return;
    }
    const newData = JSON.parse(JSON.stringify(data));
    const person = newData.find((person) => person.id === selectedPersonId);
    person.dates.push({
      id: uuid(),
      start: "",
      finish: "",
      type: Types["Normal"],
      diff: 0,
    });
    setData(newData);
  };

  const onTypeChange = (dateId, newType) => {
    const newData = JSON.parse(JSON.stringify(data));
    const person = newData.find((person) => person.id === selectedPersonId);
    const date = person.dates.find((d) => d.id === dateId);
    date.type = newType;
    date.diff = showCalculatedResult(date);
    setData(newData);
  };

  const deleteDate = (dateId) => {
    const newData = JSON.parse(JSON.stringify(data));
    const person = newData.find((p) => p.id === selectedPersonId);
    person.dates = person.dates.filter((d) => d.id !== dateId);
    setData(newData);
  };

  const onStartDateChange = (newValue, dateId) => {
    const newData = JSON.parse(JSON.stringify(data));
    const dates = newData.find((p) => p.id === selectedPersonId).dates;
    const date = dates.find((d) => d.id === dateId);
    date.start = newValue.replace(".", ":");
    date.diff = showCalculatedResult(date);
    setData(newData);
  };
  const onFinishDateChange = (newValue, dateId) => {
    const newData = JSON.parse(JSON.stringify(data));
    const dates = newData.find((p) => p.id === selectedPersonId).dates;
    const date = dates.find((d) => d.id === dateId);
    date.finish = newValue.replace(".", ":");
    date.diff = showCalculatedResult(date);
    setData(newData);
  };

  const getDate = (startParts) => {
    if (startParts.length === 2) {
      return new Date(2000, 1, 1, startParts[0], startParts[1], 0);
    }
    return null;
  };

  const getDiff = (date1, date2) => {
    return Math.abs(date1 - date2) / 1000 / 60;
  };

  const getStandardStartHour = (type) => {
    return type === Types["Normal"] ? 9 : type === Types["Yarım Gün"] ? 9 : 0;
  };
  const getStandardStartMinute = (type) => {
    return type === Types["Normal"] ? 0 : type === Types["Yarım Gün"] ? 0 : 0;
  };
  const getStandardStartDate = (type) => {
    return new Date(
      2000,
      1,
      1,
      getStandardStartHour(type),
      getStandardStartMinute(type),
      0
    );
  };
  const getStandardFinishDate = (type) => {
    return new Date(
      2000,
      1,
      1,
      getStandardFinishHour(type),
      getStandardFinishMinute(type),
      0
    );
  };
  const getTimeParts = (timeString) => {
    const parts = timeString
      .replace(/[^0-9:]/g, ":")
      .split(":")
      .map((x) => Number(x))
      .filter((x) => !isNaN(x));
    if (parts.length > 1) return [parts[0], parts[1]];
    if (parts.length === 1 && parts[0]) return [parts[0], 0];
    else return [];
  };

  const getStandardFinishHour = (type) => {
    return type === Types["Normal"] ? 18 : type === Types["Yarım Gün"] ? 13 : 0;
  };
  const getStandardFinishMinute = (type) => {
    return type === Types["Normal"] ? 0 : type === Types["Yarım Gün"] ? 30 : 0;
  };

  const showCalculatedResult = ({ start, finish, type }) => {
    type = Number(type);
    const startParts = getTimeParts(start);
    const finishParts = getTimeParts(finish);

    const standardStart = getStandardStartDate(type);
    const standardFinish = getStandardFinishDate(type);

    const startDate = getDate(startParts);
    const finishDate = getDate(finishParts);

    // Mesai yapılan bir gün için...
    if (type === Types["Normal"] || type === Types["Yarım Gün"]) {
      // start ve finish belliyse
      if (startDate && finishDate) {
        // start, finish'ten büyük olamaz.
        if (startDate > finishDate) return 0;

        // start, mesai bitiminden sonraysa start ve finish arası süre tümden kazançtır.
        if (startDate > standardFinish) return getDiff(startDate, finishDate);

        const diff = [];

        // start, mesai başlangıcından önceyse aradaki fark kazançtır, yoksa kayıptır.
        if (startDate < standardStart) {
          diff.push(getDiff(startDate, standardStart));
        } else {
          diff.push(-getDiff(startDate, standardStart));
        }

        // finish, mesai bitiminden sonraysa aradaki fark kazançtır, yoksa kayıptır.
        if (finishDate > standardFinish) {
          diff.push(getDiff(finishDate, standardFinish));
        } else {
          diff.push(-getDiff(finishDate, standardFinish));
        }

        // start ve finish kazançları/kayıpları toplanıyor.
        return diff.reduce((sum, x) => sum + x, 0);
      }

      // start varsa (finish yokken)
      if (startDate) {
        // finish yokken start, mesai bitiminden sonra olamaz.
        if (startDate > standardFinish) return 0;

        // start, mesai başlangıcından önceyse aradaki fark kazançtır, yoksa kayıptır.
        if (startDate < standardStart) return getDiff(startDate, standardStart);
        else return -getDiff(startDate, standardStart);
      }

      // finish varsa (start yokken)
      if (finishDate) {
        // finish, mesai başlangıcından sonra olamaz.
        if (finishDate < standardStart) return 0;

        // finish, mesai bitiminden sonraysa aradaki fark kazançtır, yoksa kayıptır.
        if (finishDate > standardFinish) {
          return getDiff(finishDate, standardFinish);
        } else {
          return -getDiff(finishDate, standardFinish);
        }
      }

      // hiçbir tarih belli değilse hesaplama yapılmaz.
      return 0;
    }

    // Normalde çalışılmayan bir gün için...
    if (type === Types["Mesai Dışı"]) {
      // start veya finish olmazsa hesaplama yapılmaz.
      if (!startDate || !finishDate) return 0;

      // start, finish'ten büyük olamaz.
      if (startDate > finishDate) return 0;

      // start ve finish arasındaki fark kazançtır.
      return getDiff(startDate, finishDate);
    }

    // Normalde çalışılan bir günde ara verildiyse
    if (type === Types["Ara Verme"]) {
      // start veya finish olmazsa hesaplama yapılmaz.
      if (!startDate || !finishDate) return 0;

      // start, finish'ten büyük olamaz.
      if (startDate > finishDate) return 0;

      // start ve finish arasındaki fark kayıptır.
      return -getDiff(startDate, finishDate);
    }
  };

  const insertResult = () => {};

  const showWithSign = (num) => {
    if (num > 0) return <div className="good result">+{num}dk</div>;
    if (num < 0) return <div className="bad result">-{Math.abs(num)}dk</div>;
    return <div className="notr result">{num}dk</div>;
  };

  return (
    <div className="app">
      <header>
        <h1>
          <span>Çalışma Saati Hesaplama Aracı</span>
          <button className="save" onClick={save}>
            Kaydet
          </button>
          <button className="load" onClick={load}>
            Kayıttan Getir
          </button>
        </h1>
      </header>
      <section id="content">
        <div className="persons content-column">
          <h2>
            <span>Kişiler</span>
            <button onClick={insertPerson}>+</button>
          </h2>
          <section>
            {data.map((person) => {
              const isSelected = person.id === selectedPersonId;
              return (
                <div
                  className={[
                    "person",
                    "content-item",
                    isSelected ? "active" : "",
                  ].join(" ")}
                  key={person.id}
                >
                  <input
                    type="text"
                    value={person.name}
                    onInput={(e) => {
                      onPersonNameChange(e, person.id);
                    }}
                    onClick={() => {
                      setSelectedPersonId(person.id);
                    }}
                  />
                  <button
                    onClick={() => {
                      deletePerson(person.id);
                    }}
                  >
                    Sil
                  </button>
                </div>
              );
            })}
          </section>
        </div>
        <div className="dates content-column">
          <h2>
            <span>{selectedPersonName ?? "Tarihler"}</span>
            <button onClick={insertDate}>+</button>
          </h2>
          <section>
            {selectedPersonDates.map((item) => {
              return (
                <div class="date content-item">
                  <select
                    value={item.type}
                    onChange={(e) => {
                      onTypeChange(item.id, e.target.value);
                    }}
                  >
                    {Object.entries(Types).map(([key, value]) => (
                      <option key={key} value={value}>
                        {key}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={item.start}
                    onInput={(e) => {
                      onStartDateChange(e.target.value, item.id);
                    }}
                    placeholder="Start"
                  />
                  <input
                    type="text"
                    value={item.finish}
                    onInput={(e) => {
                      onFinishDateChange(e.target.value, item.id);
                    }}
                    placeholder="Finish"
                  />
                  <input
                    type="text"
                    value={item.diff + "dk"}
                    disabled
                    className={
                      item.diff > 0 ? "good" : item.diff < 0 ? "bad" : "Normal"
                    }
                  />
                  <button
                    onClick={() => {
                      deleteDate(item.id);
                    }}
                  >
                    Sil
                  </button>
                </div>
              );
            })}
          </section>
        </div>
        <div className="dashboard content-column">
          <h2>
            <span>Sonuçlar</span>
            <button onClick={insertResult}>+</button>
          </h2>
          <section>
            {showWithSign(
              selectedPersonDates.reduce((sum, x) => sum + x.diff, 0)
            )}
          </section>
        </div>
      </section>
      <footer>
        <span></span>
      </footer>
    </div>
  );
}

export default App;
