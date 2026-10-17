package src.main.Backend.Model.ClassPeriod;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Objects;

// Các tiết học
public class ClassPeriod {
    private int sessionId;
    private DayOfWeek day;
    private LocalTime startTime;
    private LocalTime endTime;

    public ClassPeriod(int sessionId, DayOfWeek day, LocalTime startTime, LocalTime endTime) {
        this.sessionId = sessionId;
        this.day = Objects.requireNonNull(day, "day");
        this.startTime = Objects.requireNonNull(startTime, "startTime");
        setEndTime(endTime);
    }

    public int getSessionId() {
        return sessionId;
    }

    public void setSessionId(int sessionId) {
        this.sessionId = sessionId;
    }

    public DayOfWeek getDay() {
        return day;
    }

    public void setDay(DayOfWeek day) {
        this.day = Objects.requireNonNull(day, "day");
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        LocalTime validatedStartTime = Objects.requireNonNull(startTime, "startTime");
        if (this.endTime != null && !this.endTime.isAfter(validatedStartTime)) {
            throw new IllegalArgumentException("The End time has to be later than the Start time!");
        }
        this.startTime = validatedStartTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        LocalTime validatedEndTime = Objects.requireNonNull(endTime, "endTime");
        if (this.startTime == null || !validatedEndTime.isAfter(this.startTime)) {
            throw new IllegalArgumentException("The End time has to be later than the Start time!");
        }
        this.endTime = validatedEndTime;
    }
}
