package src.main.Backend.Model.TimeSlot;

import java.time.DayOfWeek;
import java.time.LocalTime;

public class TimeSlot {
    private int slotId;
    private DayOfWeek day;
    private LocalTime startTime;
    private LocalTime endTime;

    public int getSlotId() {
        return slotId;
    }

    public void setSlotId(int slotId) {
        this.slotId = slotId;
    }

    public DayOfWeek getDay() {
        return day;
    }

    public void setDay(DayOfWeek day) {
        this.day = day;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        if (this.startTime == null) {
            throw new IllegalArgumentException("Provide the Start time first!");
        }
        if (endTime.isAfter(this.startTime)) {
            this.endTime = endTime;
        } else {
            throw new IllegalArgumentException("The End time has to be later than the Start time!");
        }
    }
}
