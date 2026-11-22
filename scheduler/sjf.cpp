#include <iostream>
#include "scheduler.h"

using namespace std;

void sjf(Order orders[], int n)
{
    int currentTime = 0;
    int completed = 0;

    bool done[100] = {false};
    Order executionOrder[100];

    while (completed < n)
    {
        int selected = -1;

        // Select the shortest job among arrived orders.
        for (int i = 0; i < n; i++)
        {
            if (!done[i] && orders[i].arrivalTime <= currentTime)
            {
                if (selected == -1 ||
                    orders[i].prepTime < orders[selected].prepTime ||
                    (orders[i].prepTime == orders[selected].prepTime &&
                     orders[i].id < orders[selected].id))
                {
                    selected = i;
                }
            }
        }

        // If no order has arrived, move time to the next arrival.
        if (selected == -1)
        {
            int nextArrival = -1;

            for (int i = 0; i < n; i++)
            {
                if (!done[i] &&
                    (nextArrival == -1 ||
                     orders[i].arrivalTime < nextArrival))
                {
                    nextArrival = orders[i].arrivalTime;
                }
            }

            currentTime = nextArrival;
            continue;
        }

        currentTime += orders[selected].prepTime;

        orders[selected].completionTime = currentTime;
        orders[selected].turnaroundTime =
            currentTime - orders[selected].arrivalTime;
        orders[selected].waitingTime =
            orders[selected].turnaroundTime - orders[selected].prepTime;

        // Save the order in its actual execution position.
        executionOrder[completed] = orders[selected];

        done[selected] = true;
        completed++;
    }

    // Return the array in execution order.
    for (int i = 0; i < n; i++)
    {
        orders[i] = executionOrder[i];
    }
}