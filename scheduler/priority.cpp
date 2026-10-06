#include <iostream>
#include "scheduler.h"

using namespace std;

void priorityScheduling(Order orders[], int n)
{
    int currentTime = 0;
    int completed = 0;

    bool done[100] = {false};

    while (completed < n)
    {
        int selected = -1;

        for (int i = 0; i < n; i++)
        {
            if (!done[i] && orders[i].arrivalTime <= currentTime)
            {
                if (selected == -1 ||
                    orders[i].priority < orders[selected].priority)
                {
                    selected = i;
                }
            }
        }

        if (selected == -1)
        {
            currentTime++;
            continue;
        }

        currentTime += orders[selected].prepTime;

        orders[selected].completionTime = currentTime;

        orders[selected].turnaroundTime =
            orders[selected].completionTime -
            orders[selected].arrivalTime;

        orders[selected].waitingTime =
            orders[selected].turnaroundTime -
            orders[selected].prepTime;

        done[selected] = true;
        completed++;
    }
}