import { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import "./App.css";

const Types = {
  normal: 1, // Normal gün 09.00 - 18.00
  half: 2, // Yarım gün 09.00 - 13.30
  free: 3, // Tatil günü
};

function App() {
  const [data, setData] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  const save = () => {
    if(localStorage.getItem("data")) {
      if(!window.confirm("Tarayıcınızda daha önceden kaydedilmiş olan verilerin üzerine yazılacak...")) {
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
    alert("Kayıt yüklendi.")
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
      type: Types.normal,
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

  const showCalculatedResult = ({ start, finish, type }) => {
    type = Number(type);
    const startParts = start
      .split(":")
      .map((x) => Number(x))
      .filter((x) => !isNaN(x));
    const finishParts = finish
      .split(":")
      .map((x) => Number(x))
      .filter((x) => !isNaN(x));
    const now = new Date();
    const standardStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      type === Types.normal ? 9 : type === Types.half ? 9 : 0,
      0,
      0
    );
    const standardFinish = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      type === Types.normal ? 18 : type === Types.half ? 13 : 0,
      type === Types.normal ? 0 : type === Types.half ? 30 : 0,
      0
    );
    const standardDiff = (standardFinish - standardStart) / 1000 / 60;
    const diffs = [];
    if (startParts.length === 2) {
      const startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        startParts[0],
        startParts[1],
        0
      );
      const diff = (standardStart - startDate) / 1000 / 60;
      if (diff < -standardDiff) {
        diffs.push(-standardDiff);
      } else {
        diffs.push(diff);
      }
    }
    if (finishParts.length === 2) {
      const finishDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        finishParts[0],
        finishParts[1],
        0
      );
      const diff = (finishDate - standardFinish) / 1000 / 60;
      if (startParts.length === 2 && diffs[0] === -standardDiff) {
        const startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          startParts[0],
          startParts[1],
          0
        );
        const newDiff = (finishDate - startDate) / 1000 / 60;
        diffs.push(newDiff);
      } else {
        diffs.push(diff);
      }
    }
    const result = diffs.reduce((sum, x) => sum + x, 0);
    return result;
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
                      item.diff > 0 ? "good" : item.diff < 0 ? "bad" : "normal"
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
