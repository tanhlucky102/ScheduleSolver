package src.main.Backend.Model.Class;

import src.main.Backend.Model.TimeSlot.TimeSlot;

public class Class { // Các lớp học của 1 môn
    private int classId;

    private enum InnerClass {
        LEC, TUT
    }

    private InnerClass classType; // Lớp lec hay tut
    private TimeSlot classTime;

    public int getClassId() {
        return classId;
    }

    public void setClassId(int classId) {
        this.classId = classId;
    }

    public InnerClass getClassType() {
        return classType;
    }

    public void setClassType(InnerClass classType) {
        this.classType = classType;
    }

    public TimeSlot getClassTime() {
        return classTime;
    }

    public void setClassTime(TimeSlot classTime) {
        this.classTime = classTime;
    }
}
