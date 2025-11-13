-- ###### USE plays.db ##################################
Select rusher_player_id, rusher_player_name, ydstogo, yards_gained
from teams
where rush_attempt = 1

Select ydstogo, avg(yards_gained) as avg_yards_gained
from teams
where CAST(rush_attempt AS INT) = 1
group by ydstogo

--New query ryoe
Select rusher_player_name, rusher_player_id, yards_gained, 
yards_gained - (0.17091241*ydstogo + 3.07422453) as ryoe,
from teams
where CAST(rush_attempt AS INT) = 1


--Total RYOE by player
select rusher_player_name, rusher_player_id,
avg(yards_gained - (0.12588674*ydstogo + 3.47336519)) as total_ryoe,
count(*) as rush_attempts
from plays
where CAST(rush_attempt AS INT) = 1
group by rusher_player_name, rusher_player_id
having count(*) >= 100
order by total_ryoe desc

-- ADDING DOWNS TO THE QUERY ------------------------------------
SELECT
    rusher_player_id,
    rusher_player_name,
    yards_gained,
    ydstogo,
    Case
        when CAST(down AS INT) = 2 then 1
        else 0
        end as is_second_down,
    Case
        when CAST(down AS INT)= 3 then 1
        else 0
        end as is_third_down,

    Case 
        when CAST(down AS INT) = 4 then 1
        else 0
        end as is_fourth_down

FROM plays
where CAST(rush_attempt AS INT) = 1;



------------------------------------------
np.float64(2.471750805961095)
array([0.199273  , 0.73200072, 1.12417315, 0.82187461])

-------------------------------------------

with rush_data as (SELECT
    rusher_player_id,
    rusher_player_name,
    yards_gained,
    ydstogo,
    Case
        when CAST(down AS INT) = 1 then 1
        else 0
        end as is_first_down,
    Case
        when CAST(down AS INT) = 2 then 1
        else 0
        end as is_second_down,
    Case
        when CAST(down AS INT)= 3 then 1
        else 0
        end as is_third_down,

    Case 
        when CAST(down AS INT) = 4 then 1
        else 0
        end as is_fourth_down

FROM plays
where CAST(rush_attempt AS INT) = 1
)
select
    rusher_player_id,
    rusher_player_name,
    avg(yards_gained - (2.471750805961095 + 0.199273 * yardstogo +
        0.73200072 * is_second_down +
        1.12417315 * is_third_down +
        0.82187461 * is_fourth_down + 0.17091241 * ydstogo
    )) as ryoe
from rush_data
group by rusher_player_id
having count(*) >= 100
order by ryoe desc
limit 10;

