class ActionFindMasters(Action):
    def name(self):
        return "action_find_masters"

    def run(self, dispatcher, tracker, domain):
        # Извлечение параметров
        service_type = tracker.get_slot("service_type")
        location = tracker.get_slot("location")
        budget = tracker.get_slot("budget")
        event_type = tracker.get_slot("event_type")
        criteria = tracker.get_slot("criteria")  # Список критериев

        # Подключение к БД
        conn = pyodbc.connect(...)
        cursor = conn.cursor()

        # SQL-запрос с учетом типа мероприятия и критериев
        query = """
            SELECT M.Name, M.PriceForHour, S.Location 
            FROM Masters M
            INNER JOIN Services S ON M.MasterId = S.MasterId
            INNER JOIN Types T ON S.TypeId = T.TypeId
            INNER JOIN MasterCriteria MC ON M.MasterId = MC.MasterId
            INNER JOIN Criterias C ON MC.CriteriasId = C.CriteriasId
            WHERE T.TypeName = ?
              AND S.Location = ?
              AND M.PriceForHour <= ?
              AND C.Name IN ({})
        """.format(", ".join(["?"] * len(criteria)))

        params = [event_type, location, budget] + criteria
        cursor.execute(query, params)
        results = cursor.fetchall()

        # Формирование ответа
        if results:
            response = "🎉 Нашёл подходящих специалистов:\n"
            for row in results:
                response += f"- {row.Name} ({row.PriceForHour} руб./час, {row.Location})\n"
        else:
            response = "😞 Ничего не найдено. Попробуйте изменить параметры."

        dispatcher.utter_message(text=response)
        return []